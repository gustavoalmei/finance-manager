import { z } from "zod";
import { AI_MAX_TEXT_LENGTH } from "./ai-extract";

// linha revisada na tela da IA, pronta para gravar
const reviewedRow = z
  .object({
    date: z
      .string({ error: "Informe a data." })
      .regex(/^\d{4}-\d{2}-\d{2}$/, { error: "Informe uma data válida." })
      .refine(
        (value) =>
          new Date(`${value}T00:00:00Z`).toISOString().slice(0, 10) === value,
        { error: "Informe uma data válida." },
      ),
    description: z
      .string({ error: "Informe a descrição." })
      .trim()
      .min(1, "Informe a descrição.")
      .max(255, "A descrição deve ter no máximo 255 caracteres."),
    amount: z
      .number({ error: "Informe o valor." })
      .int({ error: "O valor deve estar em centavos." })
      .positive({ error: "O valor deve ser maior que zero." }),
    type: z.enum(["INCOME", "EXPENSE"], { error: "Informe o tipo." }),
    status: z.enum(["PENDING", "CONFIRMED", "CANCELLED"], {
      error: "Informe o status.",
    }),
    categoryId: z
      .string({ error: "Escolha a categoria." })
      .pipe(z.uuid({ error: "Escolha a categoria." })),
    cardId: z
      .string()
      .pipe(z.uuid({ error: "Cartão inválido." }))
      .nullable()
      .optional(),
    installmentCurrent: z.number().int().min(1).max(48),
    installmentTotal: z.number().int().min(1).max(48),
  })
  .superRefine((row, ctx) => {
    if (row.installmentCurrent > row.installmentTotal) {
      ctx.addIssue({
        code: "custom",
        message: "A parcela atual não pode ser maior que o total de parcelas.",
      });
    }
    if (row.installmentTotal > 1 && !row.cardId) {
      ctx.addIssue({
        code: "custom",
        message: "Compra parcelada precisa de um cartão.",
      });
    }
    if (row.type === "INCOME" && row.cardId) {
      ctx.addIssue({
        code: "custom",
        message: "Cartão só pode ser usado em despesa.",
      });
    }
  });

export const transactionBodySchema = {
  create: z
    .object({
      userId: z
        .string({ error: "O ID do usuário é obrigatório." })
        .nonempty({
          message: "O ID do usuário é obrigatório.",
        })
        .pipe(z.uuid({ error: "Informe um ID de usuário válido." })),
      // obrigatória sem cartão (o service confere); com cartão, vale a do cartão
      accountId: z
        .string()
        .pipe(z.uuid({ error: "ID da conta inválido." }))
        .optional(),
      categoryId: z
        .string({ error: "O ID da categoria é obrigatório." })
        .nonempty({
          message: "O ID da categoria é obrigatório.",
        })
        .pipe(z.uuid({ error: "ID da categoria inválido." })),
      type: z.enum(["INCOME", "EXPENSE", "TRANSFER"], {
        error: "Informe um tipo de transação válido.",
      }),
      status: z.enum(["PENDING", "CONFIRMED", "CANCELLED"], {
        error: "Informe um status de transação válido.",
      }),
      amount: z
        .number()
        .int({
          error: "O valor da transação deve ser um número inteiro.",
        })
        .nonnegative({
          message: "O valor da transação deve ser maior que zero.",
        }),
      description: z
        .string()
        .optional()
        .transform((value) => {
          if (value === "") {
            return null;
          }
          return value;
        }),
      date: z.iso.datetime({ error: "Informe uma data válida." }),
      isRecurring: z.boolean({ error: "Informe se a transação é recorrente." }),
      cardId: z
        .string()
        .pipe(z.uuid({ error: "ID do cartão inválido." }))
        .optional(),
      parentTransactionId: z
        .string()
        .pipe(z.uuid({ error: "ID da transação pai inválido." }))
        .optional(),
      installmentNumber: z
        .number()
        .int({ error: "O número da parcela deve ser um número inteiro." })
        .positive({ error: "O número da parcela deve ser maior que zero." })
        .optional(),
      totalInstallments: z
        .number()
        .int({ error: "O número da parcela deve ser um número inteiro." })
        .positive({ error: "O total de parcelas deve ser maior que zero." })
        .optional(),
    })
    .superRefine((data, ctx) => {
      let installmentsHaveMoreThanOne =
        data.installmentNumber && data.totalInstallments;
      if (!data.cardId && installmentsHaveMoreThanOne) {
        ctx.addIssue({
          code: "custom",
          message: "O cartão deve ser informado quando houver parcelas.",
        });
      }
      if (
        data.installmentNumber &&
        data.totalInstallments &&
        data.installmentNumber > data.totalInstallments
      ) {
        ctx.addIssue({
          code: "custom",
          message: "A parcela atual não pode ser maior que o total de parcelas.",
        });
      }
      if (data.cardId && !installmentsHaveMoreThanOne) {
        ctx.addIssue({
          code: "custom",
          message:
            "O número da parcela e o total de parcelas devem ser informados quando o cartão for informado.",
        });
      }
    }),
  update: z.object({
    userId: z
      .string({ error: "O ID do usuário é obrigatório." })
      .nonempty({
        message: "O ID do usuário é obrigatório.",
      })
      .pipe(z.uuid({ error: "Informe um ID de usuário válido." })),
    accountId: z
      .string()
      .pipe(z.uuid({ error: "ID da conta inválido." }))
      .optional(),
    categoryId: z
      .string({ error: "O ID da categoria é obrigatório." })
      .nonempty({
        message: "O ID da categoria é obrigatório.",
      })
      .pipe(z.uuid({ error: "ID da categoria inválido." })),
    type: z.enum(["INCOME", "EXPENSE", "TRANSFER"], {
      error: "Informe um tipo de transação válido.",
    }),
    status: z.enum(["PENDING", "CONFIRMED", "CANCELLED"], {
      error: "Informe um status de transação válido.",
    }),
    amount: z
      .number()
      .int({
        error: "O valor da transação deve ser um número inteiro.",
      })
      .nonnegative({
        message: "O valor da transação deve ser maior que zero.",
      }),
    description: z
      .string()
      .optional()
      .transform((value) => {
        if (value === "") {
          return null;
        }
        return value;
      }),
    date: z.iso.datetime({ error: "Informe uma data válida." }),
    isRecurring: z.boolean({ error: "Informe se a transação é recorrente." }),
    installmentNumber: z
      .number()
      .int({ error: "O número da parcela deve ser um número inteiro." })
      .positive({ error: "O número da parcela deve ser maior que zero." })
      .optional(),
    totalInstallments: z
      .number()
      .int({ error: "O número da parcela deve ser um número inteiro." })
      .positive({ error: "O total de parcelas deve ser maior que zero." })
      .optional(),
  }),
  delete: z.object({
    userId: z
      .string({ error: "O ID do usuário é obrigatório." })
      .nonempty({
        message: "O ID do usuário é obrigatório.",
      })
      .pipe(z.uuid({ error: "Informe um ID de usuário válido." })),
    id: z
      .string({ error: "O ID da transação é obrigatório." })
      .nonempty({
        message: "O ID da transação é obrigatório.",
      })
      .pipe(z.uuid({ error: "ID da transação inválido." })),
  }),
  getById: z.object({
    userId: z
      .string({ error: "O ID do usuário é obrigatório." })
      .nonempty({
        message: "O ID do usuário é obrigatório.",
      })
      .pipe(z.uuid({ error: "Informe um ID de usuário válido." })),
    id: z
      .string({ error: "O ID da transação é obrigatório." })
      .nonempty({
        message: "O ID da transação é obrigatório.",
      })
      .pipe(z.uuid({ error: "ID da transação inválido." })),
  }),
  getAll: z
    .object({
      userId: z
        .string({ error: "O ID do usuário é obrigatório." })
        .nonempty({
          message: "O ID do usuário é obrigatório.",
        })
        .pipe(z.uuid({ error: "Informe um ID de usuário válido." })),
      period: z
        .preprocess(
          (value) => {
            if (typeof value === "string") {
              try {
                return JSON.parse(value);
              } catch {
                return value;
              }
            }
            return value;
          },
          z.tuple(
            [
              z.iso.datetime({ error: "Informe uma data válida." }),
              z.iso.datetime({ error: "Informe uma data válida." }),
            ],
            {
              error: "Informe um período válido.",
            },
          ),
        )
        .optional(),
      status: z
        .enum(["PENDING", "CONFIRMED", "CANCELLED"], {
          error: "Informe um status de transação válido.",
        })
        .optional(),
      categoryId: z
        .string({ error: "Informe um ID de categoria válido." })
        .pipe(z.uuid({ error: "ID de categoria inválido." }))
        .optional(),
      type: z
        .enum(["INCOME", "EXPENSE", "TRANSFER"], {
          error: "Informe um tipo de transação válido.",
        })
        .optional(),
      isRecurring: z
        .preprocess(
          (value) => {
            if (value === "true") return true;
            if (value === "false") return false;
            return value;
          },
          z.boolean({ error: "Informe se a transação é recorrente." }),
        )
        .optional(),
      accountId: z
        .string({ error: "Informe um ID de conta válido." })
        .pipe(z.uuid({ error: "ID de conta inválido." }))
        .optional(),
      cardId: z
        .string({ error: "ID do cartão inválido." })
        .pipe(z.uuid({ error: "ID do cartão inválido." }))
        .optional(),
    })
    .superRefine((data, ctx) => {
      if (data.period && data.period[0] > data.period[1]) {
        ctx.addIssue({
          code: "custom",
          message: "A data inicial deve ser menor que a data final.",
        });
      }
    }),
  transfer: z.object({
    sourceAccount: z
      .string({ error: "O ID da conta de origem é obrigatório." })
      .pipe(z.uuid({ error: "ID da conta de origem inválido." })),
    destinationAccount: z
      .string({ error: "O ID da conta de origem é obrigatório." })
      .pipe(z.uuid({ error: "ID da conta de origem inválido." })),
    amount: z
      .number({ error: "O valor da transferência deve ser um número." })
      .int({ error: "O valor da transferência deve ser um número inteiro." })
      .positive({ error: "O valor da transferência deve ser maior que zero." }),
  }),
  aiExtract: z.object({
    text: z
      .string({ error: "Cole o texto com as transações." })
      .trim()
      .min(1, "Cole o texto com as transações.")
      .max(
        AI_MAX_TEXT_LENGTH,
        `O texto deve ter no máximo ${AI_MAX_TEXT_LENGTH} caracteres.`,
      ),
    // ausente: o back usa os modelos padrão
    model: z.string().trim().min(1).max(200).optional(),
    // origem do texto: automático, extrato da conta ou fatura de um cartão
    source: z
      .enum(["auto", "account", "card"], { error: "Origem inválida." })
      .default("auto"),
    cardId: z
      .string()
      .pipe(z.uuid({ error: "Cartão inválido." }))
      .optional(),
  })
  .refine((data) => data.source !== "card" || data.cardId, {
    message: "Escolha o cartão da fatura.",
  }),
  importRows: z.object({
    // conta das linhas sem cartão
    accountId: z
      .string()
      .pipe(z.uuid({ error: "ID da conta inválido." }))
      .optional(),
    rows: z
      .array(reviewedRow, { error: "Nenhuma transação para lançar." })
      .min(1, "Nenhuma transação para lançar.")
      // o texto da IA (20 mil caracteres) pode render algumas centenas de linhas
      .max(500, "Lance no máximo 500 transações por vez."),
  }),
  importFile: z.object({
    accountId: z
      .string()
      .pipe(z.uuid({ error: "ID da conta inválido." }))
      .optional(),
    file: z.base64({ error: "O arquivo é obrigatório." }),
    name: z.string({ error: "O nome do arquivo é obrigatório." }),
  }),
};
