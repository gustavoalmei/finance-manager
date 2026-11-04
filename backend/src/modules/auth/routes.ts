import type { FastifyReply, FastifyInstance } from "fastify";
import { authController } from "./contoller";

export default async function routes(fastify: FastifyInstance) {
  // 10 tentativas por minuto por IP: barra brute force e enumeração
  const authRateLimit = {
    config: { rateLimit: { max: 10, timeWindow: "1 minute" } },
  };

  fastify.post("/login", authRateLimit, authController.handlerLogin);
  fastify.post("/register", authRateLimit, authController.handlerRegister);
  fastify.post("/logout", authController.handlerLogout);
}
