import { HttpError } from "@/shared/erros/http-error";

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const MODELS_URL = "https://openrouter.ai/api/v1/models";

// Modelos gratuitos (":free") com saída estruturada. O OpenRouter tenta o
// próximo da lista quando um falha ou sai do ar (os gratuitos mudam sem aviso).
// Troque por OPENROUTER_MODELS no .env, separados por vírgula.
// Ordem medida em 26/10/2026: o 120b estava instável (status -5 na API) e ficou por último.
const DEFAULT_MODELS = [
  "nvidia/nemotron-3.5-super-vl:free",
  "google/gemma-4-31b-it:free",
  "nvidia/nemotron-3-super-120b-a12b:free",
];

// limite do campo "models" da API (mais que isso retorna 400)
const MAX_MODELS = 3;

// modelo gratuito é lento (~30 tokens/s medidos): folga para listas grandes
const TIMEOUT_MS = 120_000;

type ChatJsonInput = {
  // escolhido pelo usuário (já validado por isAllowedModel); vai na frente da lista
  model?: string | undefined;
  system: string;
  user: string;
  schemaName: string;
  // JSON Schema da resposta (strict: todos os campos required, sem extras)
  schema: Record<string, unknown>;
};

const fallbackModels = () => {
  const configured = (process.env.OPENROUTER_MODELS ?? "")
    .split(",")
    .map((model) => model.trim())
    .filter(Boolean);
  return configured.length > 0 ? configured : DEFAULT_MODELS;
};

export type FreeModel = {
  id: string;
  name: string;
  contextLength: number;
  // raciocínio obrigatório: o modelo recusa reasoning.effort "none"
  reasoningMandatory: boolean;
};

// lista pública muda pouco: 1 consulta por hora basta
const MODELS_CACHE_MS = 60 * 60 * 1000;
let modelsCache: { at: number; models: FreeModel[] } | null = null;

// Modelos gratuitos que aceitam saída em JSON (os únicos que servem aqui).
// A API de modelos do OpenRouter é pública: não usa a chave.
export const listFreeModels = async (): Promise<FreeModel[]> => {
  if (modelsCache && Date.now() - modelsCache.at < MODELS_CACHE_MS) {
    return modelsCache.models;
  }

  let body: any;
  try {
    const response = await fetch(MODELS_URL, {
      signal: AbortSignal.timeout(15_000),
    });
    if (!response.ok) throw new Error(String(response.status));
    body = await response.json();
  } catch {
    // sem rede: mantém a última lista conhecida em vez de quebrar a tela
    if (modelsCache) return modelsCache.models;
    throw new HttpError(502, "Não foi possível carregar os modelos de IA.");
  }

  const models: FreeModel[] = (body?.data ?? [])
    .filter(
      (model: any) =>
        typeof model?.id === "string" &&
        model.id.endsWith(":free") &&
        (model.supported_parameters ?? []).includes("response_format"),
    )
    .map((model: any) => ({
      id: model.id,
      name: model.name ?? model.id,
      contextLength: model.context_length ?? 0,
      reasoningMandatory: model.reasoning?.mandatory === true,
    }))
    .sort((a: FreeModel, b: FreeModel) => a.name.localeCompare(b.name));

  modelsCache = { at: Date.now(), models };
  return models;
};

// Só modelo gratuito da lista: impede usar um modelo pago com a chave do projeto
export const isAllowedModel = async (model: string) =>
  (await listFreeModels()).some((item) => item.id === model);

// Pede ao modelo um JSON no formato do schema e devolve já parseado.
// O formato NÃO é garantido em todo provedor gratuito: quem chama valida (zod).
export const chatJson = async ({
  model,
  system,
  user,
  schemaName,
  schema,
}: ChatJsonInput): Promise<{ data: unknown; model: string }> => {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new HttpError(
      503,
      "A IA não está configurada: defina OPENROUTER_API_KEY no .env do backend.",
    );
  }

  const models = [
    ...new Set([...(model ? [model] : []), ...fallbackModels()]),
  ].slice(0, MAX_MODELS);

  // Extrair JSON não precisa de raciocínio, e ele domina o tempo: medido, 84%
  // dos tokens gerados eram raciocínio (51s para 3 linhas). Desliga com "none";
  // se algum modelo da lista exige raciocínio, usa o mínimo que ele aceita.
  const mandatory = new Set(
    (await listFreeModels().catch(() => []))
      .filter((item) => item.reasoningMandatory)
      .map((item) => item.id),
  );
  const effort = models.some((id) => mandatory.has(id)) ? "low" : "none";

  // o corpo chega aos poucos (cabeçalhos em <1s): o limite cobre a leitura também
  const signal = AbortSignal.timeout(TIMEOUT_MS);
  let response: Response;
  let body: any;
  try {
    response = await fetch(OPENROUTER_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        // o escolhido primeiro; os outros só se ele falhar (máximo 3)
        models,
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
        response_format: {
          type: "json_schema",
          json_schema: { name: schemaName, strict: true, schema },
        },
        provider: {
          // só provedores que aceitam response_format (senão o JSON vem livre)
          require_parameters: true,
          // "deny": evita provedores que guardam/treinam com o texto (dados
          // financeiros). Com modelos gratuitos isso pode não sobrar provedor:
          // OPENROUTER_DATA_COLLECTION=allow libera, ciente do risco.
          data_collection:
            process.env.OPENROUTER_DATA_COLLECTION === "allow"
              ? "allow"
              : "deny",
        },
        reasoning: { effort },
        temperature: 0,
      }),
      signal,
    });
    body = response.ok ? await response.json() : null;
  } catch (error: any) {
    if (error?.name === "TimeoutError") {
      throw new HttpError(504, "A IA demorou demais para responder. Tente de novo.");
    }
    throw new HttpError(502, "Não foi possível falar com a IA.");
  }

  if (!response.ok) {
    // nenhum provedor atende: com modelos gratuitos, quase sempre é o "deny"
    if (
      response.status === 404 &&
      process.env.OPENROUTER_DATA_COLLECTION !== "allow"
    ) {
      throw new HttpError(
        502,
        "Nenhum provedor gratuito aceita processar sem guardar os dados. Para usar os modelos gratuitos, defina OPENROUTER_DATA_COLLECTION=allow no .env do backend (o texto pode ser guardado ou usado para treino pelo provedor).",
      );
    }
    if (response.status === 429) {
      throw new HttpError(
        429,
        "Limite de uso da IA gratuita atingido. Tente de novo mais tarde.",
      );
    }
    // 404 costuma ser "nenhum provedor atende": com data_collection=deny é o caso
    const detail = await response.text().catch(() => "");
    throw new HttpError(
      502,
      `A IA recusou o pedido (${response.status}). ${detail.slice(0, 200)}`.trim(),
    );
  }

  const content = body?.choices?.[0]?.message?.content;
  if (typeof content !== "string") {
    throw new HttpError(502, "A IA não devolveu uma resposta.");
  }

  try {
    // alguns modelos embrulham o JSON em ```json ... ```
    return {
      data: JSON.parse(content.replace(/^```(?:json)?\s*|\s*```$/g, "")),
      // qual modelo respondeu de fato (pode ter sido um reserva)
      model: typeof body?.model === "string" ? body.model : (model ?? ""),
    };
  } catch {
    throw new HttpError(502, "A IA devolveu um formato inválido. Tente de novo.");
  }
};
