import { z } from "zod";

export const accountBodySchema = {
  create: z.object({
    name: z
      .string({ error: "O nome da conta é obrigatório." })
      .trim()
      .min(1, "O nome da conta é obrigatório."),
    type: z
      .string({ error: "O tipo da conta é obrigatório." })
      .trim()
      .min(1, "O tipo da conta é obrigatório."),
    accountBalance: z.number({
      error: "O saldo da conta deve ser um número.",
    }),
  }),
  update: z.object({
    name: z
      .string({ error: "O nome da conta é obrigatório." })
      .trim()
      .min(1, "O nome da conta é obrigatório."),
    type: z
      .string({ error: "O tipo da conta é obrigatório." })
      .trim()
      .min(1, "O tipo da conta é obrigatório."),
    accountBalance: z.number({
      error: "O saldo da conta deve ser um número.",
    }),
  }),
};
