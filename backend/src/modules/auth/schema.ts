import z, { superRefine } from "zod";

// mesma regra no cadastro e na troca de senha (me/schema.ts)
export const passwordSchema = z
  .string({ error: "A senha é obrigatório." })
  .min(6, {
    message: "A senha deve ter no mínimo 6 caracteres.",
  })
  .superRefine((data, ctx) => {
    const passwordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{6,}$/;
    if (!passwordRegex.test(data)) {
      ctx.addIssue({
        code: "custom",
        message:
          "A senha deve conter pelo menos uma letra maiúscula, uma letra minúscula, um número e um caractere especial.",
      });
    }
  });

export const authBodySchema = {
  login: z.object({
    email: z
      .string({ error: "O email é obrigatório." })
      .trim()
      .toLowerCase()
      .pipe(z.email({ error: "O email é inválido." })),
    password: z.string({ error: "A senha é obrigatório." }),
  }),
  register: z.object({
    name: z.string({ error: "O nome é obrigatório." }),
    email: z
      .string({ error: "O email é obrigatório." })
      .trim()
      .toLowerCase()
      .pipe(z.email({ error: "O email é inválido." })),
    password: passwordSchema,
  }),
};
