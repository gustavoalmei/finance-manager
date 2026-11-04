import type { FastifyInstance, FastifyReply } from "fastify";
import handlerHealth from "./controller";

export default async function routes(fastify: FastifyInstance) {
  fastify.get("/health", async (request, reply: FastifyReply) => {
    const result = await handlerHealth();
    return reply.code(result.status === "ok" ? 200 : 503).send(result);
  });
}
