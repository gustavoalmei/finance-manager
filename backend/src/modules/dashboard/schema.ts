import { z } from "zod";

// Tipos de widget do front (components/home/widgets). Novo tipo: adicionar aqui também.
export const widgetTypes = [
  "balance-total",
  "income",
  "expense",
  "result",
  "invoices",
  "evolution",
  "expenses-by-category",
  "spending-by-card",
  "balance-by-account",
  "card-limit",
  "category-ranking",
  "recent-transactions",
  "upcoming-bills",
  "carousel",
] as const;

// widgets que podem virar slide de um carrossel
export const slideTypes = [
  "evolution",
  "expenses-by-category",
  "spending-by-card",
  "invoices",
  "balance-by-account",
  "card-limit",
  "category-ranking",
  "recent-transactions",
  "upcoming-bills",
] as const;

const chart = z.enum(["bar", "line", "pie"], {
  error: "Informe um tipo de gráfico válido.",
});

const slide = z.object({
  type: z.enum(slideTypes, { error: "Informe um slide válido." }),
  chart: chart.optional(),
});

const widget = z
  .object({
    id: z
      .string({ error: "O ID do widget é obrigatório." })
      .min(1, "O ID do widget é obrigatório.")
      .max(40, "ID do widget inválido."),
    type: z.enum(widgetTypes, { error: "Informe um tipo de widget válido." }),
    size: z.enum(["sm", "md", "lg"], { error: "Informe um tamanho válido." }),
    chart: chart.optional(),
    slides: z
      .array(slide)
      .min(2, "O carrossel precisa de pelo menos 2 slides.")
      .max(6, "O carrossel pode ter no máximo 6 slides.")
      .optional(),
  })
  .superRefine((data, ctx) => {
    if (data.type === "carousel" && !data.slides) {
      ctx.addIssue({
        code: "custom",
        message: "O carrossel precisa de slides.",
      });
    }
    if (data.type !== "carousel" && data.slides) {
      ctx.addIssue({
        code: "custom",
        message: "Só o carrossel pode ter slides.",
      });
    }
  });

export type Widget = z.infer<typeof widget>;

export const dashboardSchema = {
  summary: z
    .object({
      from: z.iso.datetime({ error: "Informe uma data inicial válida." }),
      to: z.iso.datetime({ error: "Informe uma data final válida." }),
      // mesmo escopo do header: cartão tem prioridade sobre a conta
      accountId: z
        .string()
        .pipe(z.uuid({ error: "ID de conta inválido." }))
        .optional(),
      cardId: z
        .string()
        .pipe(z.uuid({ error: "ID do cartão inválido." }))
        .optional(),
    })
    .superRefine((data, ctx) => {
      if (data.from > data.to) {
        ctx.addIssue({
          code: "custom",
          message: "A data inicial deve ser menor que a data final.",
        });
      }
    }),
  layout: z.object({
    widgets: z
      .array(widget, { error: "Informe a lista de widgets." })
      .max(30, "O layout pode ter no máximo 30 widgets.")
      .refine(
        (widgets) => new Set(widgets.map((item) => item.id)).size === widgets.length,
        { message: "Há widgets com o mesmo ID." },
      ),
  }),
};
