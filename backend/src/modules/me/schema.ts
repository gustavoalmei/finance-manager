import { z } from "zod";
import { passwordSchema } from "../auth/schema";

export const meBodySchema = {
  // Sem envio de e-mail ainda: o novo e-mail é digitado duas vezes para evitar
  // erro de digitação (o e-mail é o login). A senha atual é conferida no service.
  profile: z
    .object({
      name: z
        .string({ error: "O nome é obrigatório." })
        .trim()
        .min(1, "O nome é obrigatório.")
        .max(100, "O nome deve ter no máximo 100 caracteres."),
      email: z
        .string({ error: "O e-mail é obrigatório." })
        .trim()
        .toLowerCase()
        .pipe(z.email({ error: "O e-mail é inválido." })),
      emailConfirmation: z
        .string({ error: "Confirme o e-mail." })
        .trim()
        .toLowerCase(),
      currentPassword: z.string().optional(),
    })
    .refine((data) => data.email === data.emailConfirmation, {
      message: "Os e-mails não conferem.",
    }),
  password: z
    .object({
      currentPassword: z
        .string({ error: "Informe a senha atual." })
        .min(1, "Informe a senha atual."),
      newPassword: passwordSchema,
      confirmation: z.string({ error: "Confirme a nova senha." }),
    })
    .refine((data) => data.newPassword === data.confirmation, {
      message: "As senhas não conferem.",
    })
    .refine((data) => data.newPassword !== data.currentPassword, {
      message: "A nova senha deve ser diferente da atual.",
    }),
  preferences: z.object({
    // até 28: todo mês tem esse dia (sem o caso "dia 31 em fevereiro")
    monthStartDay: z
      .number({ error: "Informe o dia de início do mês." })
      .int({ error: "Informe um dia válido." })
      .min(1, "O dia deve ser entre 1 e 28.")
      .max(28, "O dia deve ser entre 1 e 28."),
  }),
};
