import { randomUUID } from "node:crypto";
import ExcelJS from "exceljs";
import { transactionRepository } from "./repository";
import { HttpError } from "@/shared/erros/http-error";
import { authRepository } from "../auth/repository";
import { categoryRepository } from "../category/repository";
import { cardRepository } from "../card/repository";
import { accountRepository } from "../account/repository";
import type { Transaction } from "@/generated/prisma/client";
import { addMonthsUTC } from "@/shared/utils/date";
import { isAllowedModel, listFreeModels } from "@/shared/ai/openrouter";
import { extractDrafts } from "./ai-extract";
import type { AiSource } from "./ai-extract";

type createTransactionType = {
  userId: string;
  // conta escolhida; compra no cartão usa a conta do cartão
  accountId?: string;
  categoryId: string;
  type: "INCOME" | "EXPENSE" | "TRANSFER";
  status: "PENDING" | "CONFIRMED" | "CANCELLED";
  amount: number;
  description: string;
  date: Date;
  isRecurring: true | false;
  cardId?: string;
  parentTransactionId?: string;
  installmentNumber?: number;
  totalInstallments?: number;
};

type transactionWithCardType = {
  userId: string;
  accountId: string;
  categoryId: string;
  type: "INCOME" | "EXPENSE" | "TRANSFER";
  status: "PENDING" | "CONFIRMED" | "CANCELLED";
  amount: number;
  description: string;
  date: Date;
  isRecurring: true | false;
  cardId: string;
  parentTransactionId?: string;
  installmentNumber: number;
  totalInstallments: number;
};

type updateTransactionType = {
  id: string;
  userId: string;
  accountId?: string;
  categoryId: string;
  type: "INCOME" | "EXPENSE" | "TRANSFER";
  status: "PENDING" | "CONFIRMED" | "CANCELLED";
  amount: number;
  description: string;
  date: Date;
  isRecurring: true | false;
  installmentNumber?: number;
  totalInstallments?: number;
};

type objectUpdateTransactionType = {
  id: string;
  userId: string;
  accountId: string;
  data: {
    accountId?: string;
    categoryId: string;
    type: "INCOME" | "EXPENSE" | "TRANSFER";
    status: "PENDING" | "CONFIRMED" | "CANCELLED";
    amount: number;
    description: string;
    date: Date;
    isRecurring: true | false;
    installmentNumber?: number;
    totalInstallments?: number;
  };
};

type deleteTransactionType = {
  id: string;
  userId: string;
};

type getByIdTransactionType = {
  id: string;
  userId: string;
};

type getAllTransactionType = {
  userId: string;
  period?: [string, string] | undefined;
  status?: "PENDING" | "CONFIRMED" | "CANCELLED" | undefined;
  categoryId?: string | undefined;
  type?: "INCOME" | "EXPENSE" | "TRANSFER" | undefined;
  isRecurring?: boolean | undefined;
  accountId?: string | undefined;
  cardId?: string | undefined;
};

type transferTransactionType = {
  userId: string;
  sourceAccount: string;
  destinationAccount: string;
  amount: number;
  date: Date;
  categoryId: string;
  description?: string;
  isRecurring: true | false;
};

type aiExtractType = {
  userId: string;
  text: string;
  model?: string | undefined;
  source: "auto" | "account" | "card";
  // só na origem "card"
  cardId?: string | undefined;
};

// linha revisada na tela da IA (ids já escolhidos pelo usuário)
type ReviewedRow = {
  date: string; // "AAAA-MM-DD"
  description: string;
  amount: number; // centavos
  type: "INCOME" | "EXPENSE";
  status: "PENDING" | "CONFIRMED" | "CANCELLED";
  categoryId: string;
  cardId?: string | null | undefined;
  installmentCurrent: number;
  installmentTotal: number;
};

type importRowsType = {
  userId: string;
  accountId?: string | undefined;
  rows: ReviewedRow[];
};

// Linha pronta para gravar, já com categoria e cartão resolvidos.
// Planilha e IA chegam aqui pelo mesmo formato.
type RowToInsert = {
  date: Date;
  description: string;
  amount: number;
  type: "INCOME" | "EXPENSE";
  status: "PENDING" | "CONFIRMED" | "CANCELLED";
  isRecurring: boolean;
  categoryId: string;
  card?: { id: string; accountId: string } | undefined;
  installments: number;
  currentInstallment: number;
};

type importFileTransactionType = {
  userId: string;
  // conta das linhas sem cartão
  accountId?: string;
  file: string;
  name: string;
};

// Layout do modelo gerado no front (import-transactions-dialog.tsx): título · cabeçalho · dados
const IMPORT_HEADER_ROW = 2;
const IMPORT_FIRST_DATA_ROW = 3;

type ImportColumn<T> = {
  header: string;
  required: boolean;
  // usado quando a coluna opcional vem vazia ou não existe
  default?: T;
  // recebe um valor não vazio; null = inválido
  parse: (value: unknown) => T | null;
  error: string;
};

// compara cabeçalhos/rótulos sem diferenciar maiúsculas e acentos ("Descricao" = "Descrição")
const normalizeLabel = (value: string) =>
  value.normalize("NFD").replace(/[̀-ͯ]/g, "").trim().toLowerCase();

const parseLabel =
  <T>(options: Record<string, T>) =>
  (value: unknown) =>
    typeof value === "string" ? (options[normalizeLabel(value)] ?? null) : null;

const parseText = (value: unknown) =>
  typeof value === "string" || typeof value === "number"
    ? String(value).trim() || null
    : null;

const importColumns = {
  date: {
    header: "Data",
    required: true,
    parse: (value) => {
      if (value instanceof Date) return isNaN(value.getTime()) ? null : value;
      // célula de texto: dd/mm/aaaa
      const match =
        typeof value === "string" &&
        value.trim().match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
      if (!match) return null;
      const [, day, month, year] = match.map(Number) as number[];
      const date = new Date(Date.UTC(year!, month! - 1, day!));
      return date.getUTCDate() === day ? date : null;
    },
    error: "Data inválida. Use o formato dd/mm/aaaa.",
  },
  description: {
    header: "Descrição",
    required: true,
    parse: parseText,
    error: "Descrição inválida.",
  },
  amount: {
    header: "Valor",
    required: true,
    // planilha em reais, banco em centavos
    parse: (value) =>
      typeof value === "number" && value > 0 ? Math.round(value * 100) : null,
    error: "O valor deve ser um número maior que zero.",
  },
  type: {
    header: "Tipo",
    required: true,
    // transferência tem fluxo próprio (transfer)
    parse: parseLabel({ receita: "INCOME", despesa: "EXPENSE" } as const),
    error: 'Tipo inválido. Use "Receita" ou "Despesa".',
  },
  status: {
    header: "Status",
    required: false,
    default: { status: "CONFIRMED" },
    // mesmos textos do formulário; `type` diz a qual Tipo o texto pertence
    parse: parseLabel({
      "a pagar": { status: "PENDING", type: "EXPENSE" },
      pago: { status: "CONFIRMED", type: "EXPENSE" },
      "a receber": { status: "PENDING", type: "INCOME" },
      recebido: { status: "CONFIRMED", type: "INCOME" },
      // sem `type`: vale para despesa e receita
      cancelada: { status: "CANCELLED" },
    } as const),
    error:
      'Status inválido. Use "Pago" ou "A pagar" (despesa), "Recebido" ou "A receber" (receita), ou "Cancelada".',
  },
  category: {
    header: "Categoria",
    required: true,
    parse: parseText,
    error: "Categoria inválida.",
  },
  isRecurring: {
    header: "Recorrente",
    required: false,
    default: false,
    parse: parseLabel({ sim: true, nao: false }),
    error: 'Recorrente inválido. Use "Sim" ou "Não".',
  },
  // em branco = débito na conta
  card: {
    header: "Cartão",
    required: false,
    parse: parseText,
    error: "Cartão inválido.",
  },
  installments: {
    header: "Parcelas",
    required: false,
    default: 1,
    // mesmo limite do formulário (MAX_INSTALLMENTS)
    parse: (value) =>
      typeof value === "number" &&
      Number.isInteger(value) &&
      value >= 1 &&
      value <= 48
        ? value
        : null,
    error: "Parcelas deve ser um número inteiro de 1 a 48.",
  },
  // compra que já começou (ex.: 4 de 10): Valor passa a ser o da parcela e
  // Data a da parcela atual; as anteriores não são criadas
  currentInstallment: {
    header: "Parcela atual",
    required: false,
    default: 1,
    parse: (value) =>
      typeof value === "number" &&
      Number.isInteger(value) &&
      value >= 1 &&
      value <= 48
        ? value
        : null,
    error: "Parcela atual deve ser um número inteiro de 1 a 48.",
  },
} satisfies {
  date: ImportColumn<Date>;
  description: ImportColumn<string>;
  amount: ImportColumn<number>;
  type: ImportColumn<"INCOME" | "EXPENSE">;
  status: ImportColumn<{
    status: "PENDING" | "CONFIRMED" | "CANCELLED";
    type?: "INCOME" | "EXPENSE";
  }>;
  category: ImportColumn<string>;
  isRecurring: ImportColumn<boolean>;
  card: ImportColumn<string>;
  installments: ImportColumn<number>;
  currentInstallment: ImportColumn<number>;
};

// card é a única coluna sem default: vazia, fica undefined
type ImportedRow = {
  [K in Exclude<keyof typeof importColumns, "card">]: NonNullable<
    ReturnType<(typeof importColumns)[K]["parse"]>
  >;
} & { card?: string };

// valor útil da célula: fórmula vira o resultado; texto formatado e link viram texto
function readCell(cell: ExcelJS.Cell) {
  const value = cell.value;
  if (value && typeof value === "object" && !(value instanceof Date)) {
    if ("result" in value) return value.result ?? null;
    return cell.text;
  }
  return value;
}

interface transactionService {
  create: (
    data: createTransactionType,
  ) => Promise<{ message: string } | HttpError>;
  update: (data: updateTransactionType) => Promise<{ message: string }>;
  getById: (data: getByIdTransactionType) => Promise<Transaction>;
  getAllTransactions: (data: getAllTransactionType) => Promise<Transaction[]>;
  delete: (
    userId: deleteTransactionType,
  ) => Promise<{ message: string } | void>;
  transfer: (data: transferTransactionType) => Promise<any>;
  importFile: (data: importFileTransactionType) => Promise<any>;
  aiModels: () => Promise<any>;
  aiExtract: (data: aiExtractType) => Promise<any>;
  importRows: (data: importRowsType) => Promise<any>;
}

// Monta as transações (e parcelas) das linhas resolvidas. Sem cartão: conta
// escolhida; com cartão: conta do cartão. Compra nova → amount é o total;
// já começou (parcela atual > 1) → amount é o da parcela e date é a da
// parcela atual; cada seguinte cai 1 mês depois e as anteriores não são criadas.
function buildTransactions(
  userId: string,
  rows: RowToInsert[],
  accountId: string | undefined,
) {
  return rows.flatMap((row) => {
    const base = {
      userId,
      categoryId: row.categoryId,
      type: row.type,
      status: row.status,
      description: row.description,
      date: row.date,
      isRecurring: row.isRecurring,
    };
    if (!row.card) {
      return [{ ...base, accountId: accountId!, amount: row.amount }];
    }

    const total = row.installments;
    const start = row.currentInstallment;
    // amount é sempre o total da compra, mesmo já começada (ex.: 4 de 10)
    const installmentAmount = Math.round(row.amount / total);
    // id da 1ª criada gerado aqui para as outras apontarem para ela no mesmo INSERT
    const parentId = randomUUID();
    const card = row.card;
    return Array.from({ length: total - start + 1 }, (_, i) => ({
      ...base,
      ...(i === 0 ? { id: parentId } : { parentTransactionId: parentId }),
      accountId: card.accountId,
      cardId: card.id,
      amount: installmentAmount,
      date: addMonthsUTC(row.date, i),
      installmentNumber: start + i,
      totalInstallments: total,
      // parcelada não é recorrente (o formulário faz o mesmo)
      isRecurring: total > 1 ? false : row.isRecurring,
    }));
  });
}

// Conta do lançamento: a do cartão (compra no cartão) ou a escolhida pelo usuário
async function resolveAccountId(
  userId: string,
  accountId: string | undefined,
  card?: { accountId: string },
) {
  if (card) return card.accountId;
  if (!accountId) {
    throw new HttpError(400, "Selecione a conta do lançamento.");
  }
  const account = await accountRepository.findById({ id: accountId, userId });
  if (!account) {
    throw new HttpError(404, "Conta não encontrada.");
  }
  return account.id as string;
}

async function createTransactionWithCard(data: transactionWithCardType) {
  try {
    if (data.totalInstallments < 1) {
      throw new HttpError(400, "O total de parcelas deve ser maior que 0.");
    }
    if (data.installmentNumber > data.totalInstallments) {
      throw new HttpError(
        400,
        "A parcela atual não pode ser maior que o total de parcelas.",
      );
    }

    // a 1ª criada é a parcela atual (ex.: 4/10); as anteriores já foram cobradas
    // fora do app e não são criadas
    let transaction = await transactionRepository.create(data);

    if (!transaction) {
      throw new HttpError(500, "Erro ao criar a transação.");
    }

    if (data.installmentNumber < data.totalInstallments) {
      // amount já é o valor da parcela; date é a da parcela atual e cada
      // seguinte cai 1 mês depois (ex.: 4/10 hoje → 5/10 no mês que vem)
      const firstDate = new Date(data.date);
      let installments = [];
      for (
        let number = data.installmentNumber + 1;
        number <= data.totalInstallments;
        number++
      ) {
        const i = number - data.installmentNumber;
        installments.push({
          userId: data.userId,
          accountId: data.accountId,
          categoryId: data.categoryId,
          type: data.type,
          status: data.status,
          amount: data.amount,
          description: data.description,
          date: addMonthsUTC(firstDate, i),
          isRecurring: data.isRecurring,
          cardId: data.cardId,
          parentTransactionId: transaction.id,
          installmentNumber: number,
          totalInstallments: data.totalInstallments,
        });
      }
      let installmentsCreated =
        await transactionRepository.createMany(installments);
      return installmentsCreated;
    }

    return transaction;
  } catch (error: any) {
    if (error instanceof HttpError) throw error;
    throw new HttpError(500, "Erro ao buscar os cartões.");
  }
}

export const transactionService: transactionService = {
  create: async (data: createTransactionType) => {
    try {
      // Procurar se a categoria existe e pertence ao usuário
      let findCategory = await categoryRepository.findById({
        id: data.categoryId,
        userId: data.userId,
      });
      if (!findCategory) {
        throw new HttpError(404, "Categoria nao encontrada.");
      }

      // Procura se o usuario existe
      let findUser = await authRepository.findById({ id: data.userId });
      if (!findUser) {
        throw new HttpError(404, "Usuário não encontrado.");
      }

      // Procurar se o cartao existe
      let findCard;
      if (data.cardId) {
        findCard = await cardRepository.findById({
          id: data.cardId,
          userId: data.userId,
        });
        if (!findCard) {
          throw new HttpError(404, "Cartão nao encontrado.");
        }
      }

      // Procurar se a transacao pai existe
      if (data.parentTransactionId) {
        let findParentTransaction =
          await transactionRepository.findParentTransactionById({
            id: data.parentTransactionId,
            userId: data.userId,
          });
        if (!findParentTransaction) {
          throw new HttpError(404, "Transação pai não encontrada.");
        }
      }

      let accountId = await resolveAccountId(
        data.userId,
        data.accountId,
        findCard,
      );

      // se a compra foi feita com o cartao
      if (data.cardId && data.installmentNumber && data.totalInstallments) {
        let transaction = await createTransactionWithCard({
          ...data,
          accountId,
        } as transactionWithCardType);
      } else {
        // Se a compra nao foi feita com o cartao
        let transaction = await transactionRepository.create({
          ...data,
          accountId,
        });
      }

      return {
        message: "Transação criada com sucesso.",
      };
    } catch (error: any) {
      if (error instanceof HttpError) throw error;
      throw new HttpError(500, "Erro ao criar a transação.");
    }
  },
  update: async (data: updateTransactionType) => {
    try {
      let findTransaction = await transactionRepository.findById({
        id: data.id,
        userId: data.userId,
      });
      if (!findTransaction) {
        throw new HttpError(404, "Transação não encontrada.");
      }

      // Procurar se a categoria existe e pertence ao usuário
      let findCategory = await categoryRepository.findById({
        id: data.categoryId,
        userId: data.userId,
      });
      if (!findCategory) {
        throw new HttpError(404, "Categoria não encontrada.");
      }

      // Procura se o usuario existe
      let findUser = await authRepository.findById({ id: data.userId });
      if (!findUser) {
        throw new HttpError(404, "Usuário não encontrado.");
      }

      // compra no cartão fica na conta do cartão; sem conta nova, mantém a atual
      let accountId =
        findTransaction.cardId || !data.accountId
          ? findTransaction.accountId
          : await resolveAccountId(data.userId, data.accountId);

      let objectTransaction: objectUpdateTransactionType = {
        id: data.id,
        userId: data.userId,
        accountId,
        data: {
          accountId,
          categoryId: findCategory.id,
          type: data.type,
          status: data.status,
          amount: data.amount,
          description: data.description,
          date: data.date,
          isRecurring: data.isRecurring,
        },
      };

      if (data.installmentNumber) {
        objectTransaction.data.installmentNumber = data.installmentNumber;
      }
      if (data.totalInstallments) {
        objectTransaction.data.totalInstallments = data.totalInstallments;
      }
      // Se a compra nao foi feita com o cartao
      let updateTransaction =
        await transactionRepository.update(objectTransaction);

      return {
        message: "Transação atualizada com sucesso.",
      };
    } catch (error: any) {
      if (error instanceof HttpError) throw error;
      throw new HttpError(500, "Erro ao atualizar a transação.");
    }
  },
  getById: async (data: getByIdTransactionType) => {
    try {
      // Procura se o usuario existe
      let findUser = await authRepository.findById({ id: data.userId });
      if (!findUser) {
        throw new HttpError(404, "Usuário não encontrado.");
      }

      // Procura transacoes
      let transactions = await transactionRepository.findById({
        id: data.id,
        userId: findUser.id,
      });
      if (!transactions) {
        throw new HttpError(404, "Transação não encontrada.");
      }

      return transactions;
    } catch (error: any) {
      if (error instanceof HttpError) throw error;
      throw new HttpError(500, "Erro ao listar a transação.");
    }
  },
  getAllTransactions: async (data: getAllTransactionType) => {
    try {
      // Procura se o usuario existe
      let findUser = await authRepository.findById({ id: data.userId });
      if (!findUser) {
        throw new HttpError(404, "Usuário não encontrado.");
      }

      let objectFilters = {
        period: data.period ?? undefined,
        status: data.status ?? undefined,
        categoryId: data.categoryId ?? undefined,
        type: data.type ?? undefined,
        isRecurring: data.isRecurring ?? undefined,
        accountId: data.accountId ?? undefined,
        cardId: data.cardId ?? undefined,
      };

      // Procura transacoes
      let transactions = await transactionRepository.getAllTransactions({
        userId: data.userId,
        filters: objectFilters,
      });
      if (!transactions) {
        throw new HttpError(404, "Nenhuma transação encontrada.");
      }

      return transactions;
    } catch (error: any) {
      if (error instanceof HttpError) throw error;
      throw new HttpError(500, "Erro ao listar as transações.");
    }
  },
  delete: async (data: deleteTransactionType) => {
    try {
      // Procura se o usuario existe
      let findUser = await authRepository.findById({ id: data.userId });
      if (!findUser) {
        throw new HttpError(404, "Usuário não encontrado.");
      }

      // Procura transacoes
      let transactions = await transactionRepository.findById({
        id: data.id,
        userId: data.userId,
      });
      if (!transactions) {
        throw new HttpError(404, "Nenhuma transação encontrada.");
      }

      let findByParentTransaction =
        await transactionRepository.findByParentTransactionId({
          id: data.id,
          userId: data.userId,
        });

      if (!findByParentTransaction) {
        throw new HttpError(404, "Nenhuma transação encontrada.");
      }

      if (findByParentTransaction.length > 0) {
        let IDsTransactions = findByParentTransaction.map(
          (children: any) => children.id,
        );
        await transactionRepository.deleteMany({
          id: IDsTransactions,
          userId: data.userId,
        });
        return;
      }
      await transactionRepository.delete({
        id: data.id,
        userId: data.userId,
      });

      return {
        message: "Transação deletada com sucesso.",
      };
    } catch (error: any) {
      if (error instanceof HttpError) throw error;
      throw new HttpError(500, "Erro ao listar as transações.");
    }
  },
  transfer: async (data: transferTransactionType) => {
    try {
      // Procura se o usuario existe
      let findUser = await authRepository.findById({ id: data.userId });
      if (!findUser) {
        throw new HttpError(404, "Usuário não encontrado.");
      }

      // procura conta origem
      let findAccount = await accountRepository.findById({
        id: data.sourceAccount,
        userId: data.userId,
      });

      if (!findAccount) {
        throw new HttpError(404, "Conta não encontrada.");
      }

      // procura conta destino
      let findDestinationAccount = await accountRepository.findById({
        id: data.destinationAccount,
        userId: data.userId,
      });

      if (!findDestinationAccount) {
        throw new HttpError(404, "Conta de destino nao encontrada.");
      }

      if (data.sourceAccount === data.destinationAccount) {
        throw new HttpError(404, "Conta de destino não pode ser a mesma.");
      }

      if (findAccount.accountBalance < data.amount) {
        throw new HttpError(404, "Saldo insuficiente.");
      }

      let objectTransfer = {
        sourceAccountId: data.sourceAccount,
        destinationAccountId: data.destinationAccount,
        amount: data.amount,
        userId: data.userId,
        accountId: findAccount.id,
        type: "TRANSFER" as const,
        // o dinheiro já sai da origem e entra no destino: confirmada
        status: "CONFIRMED" as const,
        date: data.date,
        description: data.description ?? "",
        isRecurring: data.isRecurring,
        categoryId: data.categoryId,
      };

      // realiza a transferencia e atualiza os dois saldos na mesma transação do banco
      await transactionRepository.transfer(objectTransfer);

      return {
        message: "Transferência realizada com sucesso.",
      };
    } catch (error: any) {
      if (error instanceof HttpError) throw error;
      throw new HttpError(500, "Erro ao listar as transações.");
    }
  },
  importFile: async (data: importFileTransactionType) => {
    try {
      const workbook = new ExcelJS.Workbook();
      try {
        // ArrayBuffer em vez de Buffer: os tipos do ExcelJS 4.4 conflitam com o Buffer do @types/node
        await workbook.xlsx.load(
          new Uint8Array(Buffer.from(data.file, "base64")).buffer,
        );
      } catch {
        // base64 válido, mas o conteúdo não é um .xlsx (ex.: .xls ou arquivo renomeado)
        throw new HttpError(
          400,
          "Não foi possível ler a planilha. Envie um arquivo .xlsx.",
        );
      }

      // planilha lida: linha 1 = título, linha 2 = cabeçalho, dados a partir da 3
      const sheet = workbook.worksheets[0];
      if (!sheet) {
        throw new HttpError(400, "A planilha enviada está vazia.");
      }

      // cabeçalho -> número da coluna, para aceitar as colunas em qualquer ordem
      const columnByHeader = new Map<string, number>();
      sheet.getRow(IMPORT_HEADER_ROW).eachCell((cell, colNumber) => {
        columnByHeader.set(normalizeLabel(cell.text), colNumber);
      });

      const columns = Object.entries(importColumns) as [
        keyof ImportedRow,
        ImportColumn<unknown>,
      ][];

      const missing = columns
        .filter(
          ([, column]) =>
            column.required &&
            !columnByHeader.has(normalizeLabel(column.header)),
        )
        .map(([, column]) => column.header);
      if (missing.length > 0) {
        throw new HttpError(
          400,
          `Colunas obrigatórias ausentes: ${missing.join(", ")}.`,
        );
      }

      const rows: ImportedRow[] = [];
      const errors: string[] = [];

      sheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
        if (rowNumber < IMPORT_FIRST_DATA_ROW) return;

        const parsed: Record<string, unknown> = {};
        for (const [key, column] of columns) {
          const colNumber = columnByHeader.get(normalizeLabel(column.header));
          const value = colNumber ? readCell(row.getCell(colNumber)) : null;

          if (value === null || value === undefined || value === "") {
            if (column.required) {
              errors.push(
                `Linha ${rowNumber}: a coluna "${column.header}" é obrigatória.`,
              );
            }
            parsed[key] = column.default;
            continue;
          }

          const result = column.parse(value);
          if (result === null) {
            errors.push(`Linha ${rowNumber}: ${column.error}`);
          }
          parsed[key] = result;
        }

        // regras entre colunas (só quando as colunas envolvidas são válidas)
        const imported = parsed as ImportedRow;
        if (
          imported.type &&
          imported.status?.type &&
          imported.status.type !== imported.type
        ) {
          errors.push(
            imported.type === "EXPENSE"
              ? `Linha ${rowNumber}: para despesa, use o status "Pago" ou "A pagar".`
              : `Linha ${rowNumber}: para receita, use o status "Recebido" ou "A receber".`,
          );
        }
        if (imported.card && imported.type && imported.type !== "EXPENSE") {
          errors.push(
            `Linha ${rowNumber}: cartão só pode ser usado em despesa.`,
          );
        }
        if (imported.installments > 1 && !imported.card) {
          errors.push(
            `Linha ${rowNumber}: compra parcelada precisa de um cartão.`,
          );
        }
        if (imported.currentInstallment > imported.installments) {
          errors.push(
            `Linha ${rowNumber}: a parcela atual não pode ser maior que o total de parcelas.`,
          );
        }
        rows.push(imported);
      });

      if (errors.length > 0) {
        throw new HttpError(400, errors.join(" "));
      }
      if (rows.length === 0) {
        throw new HttpError(400, "A planilha não tem transações.");
      }

      // linhas sem cartão vão para a conta escolhida; com cartão, para a conta do cartão
      const accountId = rows.some((row) => !row.card)
        ? await resolveAccountId(data.userId, data.accountId)
        : undefined;

      // uma busca só: nome da categoria (sem acento/maiúscula) -> id
      const userCategories = await categoryRepository.findAllByUserId({
        userId: data.userId,
      });
      const categoryIdByName = new Map<string, string>(
        userCategories.map((category: { id: string; name: string }) => [
          normalizeLabel(category.name),
          category.id,
        ]),
      );

      const unknownCategories = [
        ...new Set(
          rows
            .filter((row) => !categoryIdByName.has(normalizeLabel(row.category)))
            .map((row) => row.category),
        ),
      ];
      if (unknownCategories.length > 0) {
        throw new HttpError(
          400,
          `Categorias não encontradas: ${unknownCategories.join(", ")}. Cadastre-as antes de importar.`,
        );
      }

      // mesmo esquema das categorias, só se alguma linha usa cartão
      const cardByName = new Map<string, { id: string; accountId: string }>();
      if (rows.some((row) => row.card)) {
        const userCards = await cardRepository.getAll({ userId: data.userId });
        userCards.forEach((card) =>
          cardByName.set(normalizeLabel(card.name), card),
        );
      }

      const unknownCards = [
        ...new Set(
          rows
            .filter(
              (row) => row.card && !cardByName.has(normalizeLabel(row.card)),
            )
            .map((row) => row.card),
        ),
      ];
      if (unknownCards.length > 0) {
        throw new HttpError(
          400,
          `Cartões não encontrados: ${unknownCards.join(", ")}. Cadastre-os antes de importar.`,
        );
      }

      const transactions = buildTransactions(
        data.userId,
        rows.map((row) => ({
          date: row.date,
          description: row.description,
          amount: row.amount,
          type: row.type,
          status: row.status.status,
          isRecurring: row.isRecurring,
          categoryId: categoryIdByName.get(normalizeLabel(row.category))!,
          card: row.card ? cardByName.get(normalizeLabel(row.card)) : undefined,
          installments: row.installments,
          currentInstallment: row.currentInstallment,
        })),
        accountId,
      );

      // createMany é um único INSERT: ou entram todas as linhas, ou nenhuma
      await transactionRepository.createMany(transactions);

      return {
        message: `${rows.length} transações importadas com sucesso.`,
      };
    } catch (error: any) {
      if (error instanceof HttpError) throw error;
      throw new HttpError(500, "Erro ao importar o arquivo.");
    }
  },
  aiModels: async () => {
    try {
      return await listFreeModels();
    } catch (error: any) {
      if (error instanceof HttpError) throw error;
      throw new HttpError(500, "Erro ao listar os modelos de IA.");
    }
  },
  // Só lê e organiza: devolve rascunhos para revisão, nada é gravado
  aiExtract: async (data: aiExtractType) => {
    try {
      if (data.model && !(await isAllowedModel(data.model))) {
        throw new HttpError(400, "Escolha um modelo gratuito da lista.");
      }

      const [categories, cards] = await Promise.all([
        categoryRepository.findAllByUserId({ userId: data.userId }),
        cardRepository.getAll({ userId: data.userId }),
      ]);

      let source: AiSource = { type: data.source as "auto" | "account" };
      if (data.source === "card") {
        // o cartão da fatura tem que ser do usuário
        const card = cards.find((item) => item.id === data.cardId);
        if (!card) {
          throw new HttpError(404, "Cartão não encontrado.");
        }
        source = { type: "card", card: { id: card.id, name: card.name } };
      }

      return await extractDrafts({
        userId: data.userId,
        text: data.text,
        model: data.model,
        source,
        categories: categories.map((category: any) => ({
          id: category.id,
          name: category.name,
        })),
        cards: cards.map((card) => ({ id: card.id, name: card.name })),
      });
    } catch (error: any) {
      if (error instanceof HttpError) throw error;
      throw new HttpError(500, "Erro ao processar o texto.");
    }
  },
  // Grava as linhas revisadas: confere que categoria e cartão são do usuário
  // e usa a mesma montagem da importação de planilha
  importRows: async (data: importRowsType) => {
    try {
      const [categories, cards] = await Promise.all([
        categoryRepository.findAllByUserId({ userId: data.userId }),
        cardRepository.getAll({ userId: data.userId }),
      ]);
      const categoryIds = new Set(
        categories.map((category: { id: string }) => category.id),
      );
      const cardById = new Map(cards.map((card) => [card.id, card]));

      const unknown = data.rows.some(
        (row) =>
          !categoryIds.has(row.categoryId) ||
          (row.cardId && !cardById.has(row.cardId)),
      );
      if (unknown) {
        throw new HttpError(400, "Categoria ou cartão inválido em alguma linha.");
      }

      const accountId = data.rows.some((row) => !row.cardId)
        ? await resolveAccountId(data.userId, data.accountId)
        : undefined;

      const transactions = buildTransactions(
        data.userId,
        data.rows.map((row) => ({
          date: new Date(`${row.date}T00:00:00Z`),
          description: row.description,
          amount: row.amount,
          type: row.type,
          status: row.status,
          isRecurring: false,
          categoryId: row.categoryId,
          card: row.cardId ? cardById.get(row.cardId) : undefined,
          installments: row.installmentTotal,
          currentInstallment: row.installmentCurrent,
        })),
        accountId,
      );

      // um INSERT só: ou entram todas, ou nenhuma (e o saldo junto)
      await transactionRepository.createMany(transactions);

      return {
        message:
          data.rows.length === 1
            ? "1 transação lançada."
            : `${data.rows.length} transações lançadas.`,
      };
    } catch (error: any) {
      if (error instanceof HttpError) throw error;
      throw new HttpError(500, "Erro ao lançar as transações.");
    }
  },
};
