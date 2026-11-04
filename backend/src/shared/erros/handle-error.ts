import type { FastifyReply } from "fastify";
import { Prisma } from "@/generated/prisma/client";
import { HttpError } from "./http-error";

const PRISMA_KNOWN_ERRORS: Record<
  string,
  { statusCode: number; message: string }
> = {
  P2002: { statusCode: 409, message: "Já existe um registro com esses dados." },
  P2003: {
    statusCode: 400,
    message: "Referência inválida: o registro relacionado não existe.",
  },
  P2023: { statusCode: 400, message: "ID inválido." },
  P2025: { statusCode: 404, message: "Registro não encontrado." },
};

export function handleError(reply: FastifyReply, error: any) {
  // console.error(error);

  if (error instanceof HttpError) {
    return reply.code(error.statusCode).send({ message: error.message });
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    const mapped = PRISMA_KNOWN_ERRORS[error.code];

    if (mapped) {
      return reply.code(mapped.statusCode).send({ message: mapped.message });
    }

    return reply
      .code(400)
      .send({ message: "Não foi possível processar a solicitação." });
  }

  if (
    error instanceof Prisma.PrismaClientValidationError ||
    error instanceof Prisma.PrismaClientInitializationError
  ) {
    return reply.code(400).send({ message: "Dados inválidos." });
  }

  return reply.code(500).send({ message: "Erro interno do servidor." });
}
