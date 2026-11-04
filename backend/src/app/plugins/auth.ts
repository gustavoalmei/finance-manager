import argon2, { type HashOptions, type VerifyOptions } from "argon2";
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import fp from "fastify-plugin";
import { authRepository } from "@/modules/auth/repository";
import { HttpError } from "@/shared/erros/http-error";

declare module "fastify" {
  interface FastifyInstance {
    authenticate: (
      request: FastifyRequest,
      reply: FastifyReply,
    ) => Promise<void>;
  }
  interface FastifyRequest {
    user?: unknown;
  }
}

const auth = {
  middleware: fp(async function (fastify: FastifyInstance) {
    fastify.decorate(
      "authenticate",
      async function (request: FastifyRequest, reply: FastifyReply) {
        try {
          const token = request.session.get("session");

          if (!token) {
            throw new HttpError(403, "Não autenticado.");
          }

          const session = await authRepository.findValidSession({
            token: token,
          });

          if (!session) {
            request.session.delete();

            throw new HttpError(401, "Sessão inválida ou expirada.");
          }

          let user = {
            id: session.user.id,
            name: session.user.name,
            email: session.user.email,
            monthStartDay: session.user.monthStartDay,
          };
          request.user = user;
        } catch (error: any) {
          throw new HttpError(
            error.statusCode || 500,
            error.message || "Erro ao autenticar usuário.",
          );
        }
      },
    );
  }),
  createHash: async (password: string) => {
    const key = process.env.SECRET;
    if (!key) {
      throw new Error(
        "SECRET environment variable must be set to a 64-character hex string (32 bytes)",
      );
    }
    const argon2Options: HashOptions = {
      type: argon2.argon2id,
      memoryCost: 65536,
      timeCost: 3,
      parallelism: 4,
      hashLength: 32,
      secret: Buffer.from(key, "hex"),
    };

    return await argon2.hash(password, argon2Options);
  },
  verifyHash: async (password: string, hash: string) => {
    const key = process.env.SECRET;
    if (!key) {
      throw new Error(
        "SECRET environment variable must be set to a 64-character hex string (32 bytes)",
      );
    }
    const argon2Options: VerifyOptions = {
      secret: Buffer.from(key, "hex"),
    };

    return await argon2.verify(hash, password, argon2Options);
  },
};

export default auth;
