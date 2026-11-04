import type { FastifyInstance } from "fastify";
import { controllerCard } from "./controller";
import type { createCard, deleteCard, getCard, updateCard } from "./controller";

export default async function routes(fastify: FastifyInstance) {
  fastify.get<getCard>(
    "/card/:id",
    { preHandler: fastify.authenticate },
    controllerCard.getCard,
  );
  fastify.get(
    "/card",
    { preHandler: fastify.authenticate },
    controllerCard.getAllCards,
  );
  fastify.post<createCard>(
    "/card",
    { preHandler: fastify.authenticate },
    controllerCard.create,
  );
  fastify.put<updateCard>(
    "/card/:id",
    { preHandler: fastify.authenticate },
    controllerCard.update,
  );
  fastify.delete<deleteCard>(
    "/card/:id",
    { preHandler: fastify.authenticate },
    controllerCard.delete,
  );
}
