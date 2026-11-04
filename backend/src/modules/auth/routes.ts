import type { FastifyReply, FastifyInstance } from "fastify";
import { authController } from "./contoller";

export default async function routes(fastify: FastifyInstance) {
  fastify.post("/login", authController.handlerLogin);
  fastify.post("/register", authController.handlerRegister);
  fastify.post("/logout", authController.handlerLogout);
}
