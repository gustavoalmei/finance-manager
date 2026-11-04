import { z } from "zod";
import { HttpError } from "@/shared/erros/http-error";

const uuidSchema = z.uuid();

// Valida um :id de rota: 400 limpo quando não é UUID, em vez de deixar o
// Prisma estourar (que vira 500). Devolve o id já validado.
export function assertUuid(
  id: string | undefined,
  message = "ID inválido.",
): string {
  const parsed = uuidSchema.safeParse(id);
  if (!parsed.success) {
    throw new HttpError(400, message);
  }
  return parsed.data;
}
