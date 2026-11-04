import type { FastifyReply, FastifyRequest } from "fastify";
import { authService } from "./service";
import { handleError } from "@/shared/erros/handle-error";
import { authBodySchema } from "./schema";
import { HttpError } from "@/shared/erros/http-error";

type requestBody = {
  Body: {
    name: string;
    email: string;
    password: string;
  };
};

export const authController = {
  handlerLogin: async function (
    request: FastifyRequest<requestBody>,
    reply: FastifyReply,
  ) {
    try {
      const { email, password } = request.body;

      let schemaParsed = authBodySchema.login.safeParse(request.body);

      if (!schemaParsed.success) {
        return new HttpError(
          400,
          schemaParsed.error.issues[0]?.message ?? "Dados inválidos",
        );
      }
      const result = await authService.login({ email, password }, request);

      return reply.code(200).send(result);
    } catch (error: any) {
      return handleError(reply, error);
    }
  },
  handlerRegister: async function (
    request: FastifyRequest<requestBody>,
    reply: FastifyReply,
  ) {
    try {
      const resquestBody = request.body;

      let schemaParsed = authBodySchema.register.safeParse(resquestBody);

      if (!schemaParsed.success) {
        return new HttpError(
          400,
          schemaParsed.error.issues[0]?.message ?? "Dados inválidos",
        );
      }

      const result = await authService.create(resquestBody);
      return reply.code(201).send(result);
    } catch (error: any) {
      return handleError(reply, error);
    }
  },
  handlerLogout: async function (request: FastifyRequest, reply: FastifyReply) {
    try {
      const req = await authService.logout(request);
      return reply.code(200).send(req);
    } catch (error: any) {
      return handleError(reply, error);
    }
  },
};
