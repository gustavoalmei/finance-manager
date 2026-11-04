import { z } from "zod";
import { CardBrand } from "@/generated/prisma/enums";

const cardBody = z.object({
  name: z.string({ error: "O nome do cartão é obrigatório." }),
  description: z
    .string()
    .max(255, {
      error: "A descrição do cartão deve ter no máximo 255 caracteres.",
    })
    .optional(),
  brand: z.enum(CardBrand, { error: "Informe uma bandeira de cartão válida." }),
  // só os 4 últimos: o número completo não deve trafegar até a API (PCI DSS)
  lastFourDigits: z
    .string({ error: "Os 4 últimos dígitos do cartão são obrigatórios." })
    .regex(/^\d{4}$/, {
      error: "Informe apenas os 4 últimos dígitos do cartão.",
    }),
  creditLimit: z
    .number()
    .int({ error: "O limite de crédito deve ser um número inteiro." })
    .nonnegative({ error: "O limite de crédito é obrigatório." }),
  closingDay: z
    .number({ error: "Informe o dia de fechamento." })
    .int()
    .min(1, { error: "O dia de fechamento deve ser entre 1 e 31." })
    .max(31, { error: "O dia de fechamento deve ser entre 1 e 31." }),
  dueDay: z
    .number({ error: "Informe o dia de vencimento." })
    .int()
    .min(1, { error: "O dia de vencimento deve ser entre 1 e 31." })
    .max(31, { error: "O dia de vencimento deve ser entre 1 e 31." }),
});

export type CardBody = z.infer<typeof cardBody>;

export const cardBodySchema = {
  // a conta só é escolhida na criação: o PUT não move o cartão de conta
  create: cardBody.extend({
    accountId: z
      .string({ error: "Selecione a conta do cartão." })
      .pipe(z.uuid({ error: "ID da conta inválido." })),
  }),
  update: cardBody,
};
