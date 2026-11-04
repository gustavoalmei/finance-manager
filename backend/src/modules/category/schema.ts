import { z } from "zod";

// mesmas chaves da paleta de gráficos do front (lib/categories)
export const categoryColors = [
  "blue",
  "orange",
  "aqua",
  "yellow",
  "magenta",
  "green",
  "violet",
  "red",
] as const;

const style = {
  color: z
    .enum(categoryColors, { error: "Informe uma cor válida." })
    .optional(),
  // nome de ícone do lucide em kebab-case (ex.: shopping-cart)
  icon: z
    .string()
    .regex(/^[a-z0-9-]{1,40}$/, { error: "Informe um ícone válido." })
    .optional(),
};

export const categoryBodySchema = {
  create: z.object({
    name: z
      .string({ error: "O nome da categoria é obrigatório." })
      .trim()
      .min(1, "O nome da categoria é obrigatório."),
    description: z
      .string()
      .trim()
      .max(255, {
        error: "A descrição da categoria deve ter no máximo 255 caracteres.",
      })
      .optional(),
    ...style,
  }),
  update: z.object({
    name: z
      .string({ error: "O nome da categoria é obrigatório." })
      .trim()
      .min(1, "O nome da categoria é obrigatório."),
    description: z
      .string()
      .trim()
      .max(255, {
        error: "A descrição da categoria deve ter no máximo 255 caracteres.",
      })
      .optional(),
    ...style,
  }),
};
