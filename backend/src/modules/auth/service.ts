import auth from "@/app/plugins/auth";
import { authRepository } from "./repository";
import { HttpError } from "@/shared/erros/http-error";
import type { FastifyRequest } from "fastify";
import crypto from "node:crypto";
import { dto } from "./dto";

// Requests
type loginType = {
  email: string;
  password: string;
};

type createUserType = {
  name: string;
  email: string;
  password: string;
};

// Responses
type responseError = {
  code: number;
  message: string;
};

type loginResponseType =
  | {
      id: string;
      name: string;
      email: string;
    }
  | responseError;

type createUserResponseType =
  | {
      message: string;
    }
  | responseError;

type loggoutUserResponseType =
  | {
      message: string;
    }
  | responseError;

interface authService {
  login: (
    user: loginType,
    request: FastifyRequest,
  ) => Promise<loginResponseType>;
  create: (user: createUserType) => Promise<createUserResponseType>;
  logout: (request: FastifyRequest) => Promise<loggoutUserResponseType>;
}

export const authService: authService = {
  login: async (user: loginType, request: FastifyRequest) => {
    const EXPIRATION_IN_MILLISECONDS = 2592000000;

    try {
      const email = user.email.trim().toLowerCase();
      const findUser = await authRepository.findByEmail({ email });

      if (!findUser) {
        throw new HttpError(401, "Credenciais inválidas.");
      }

      const checkPassword = await auth.verifyHash(
        user.password,
        findUser.password,
      );

      if (!checkPassword) {
        throw new HttpError(401, "Credenciais inválidas.");
      }

      const token = crypto.randomBytes(48).toString("hex");
      const expiresAt = new Date(Date.now() + EXPIRATION_IN_MILLISECONDS);

      const session = await authRepository.createSession({
        token,
        expiresAt,
        userId: findUser.id,
      });

      request.session.set("session", session.token);

      return dto.login(findUser);
    } catch (error: any) {
      if (error instanceof HttpError) throw error;
      throw new HttpError(500, "Erro ao realizar login.");
    }
  },
  create: async (user: createUserType) => {
    try {
      const email = user.email.trim().toLowerCase();
      const objectNewUser = {
        name: user.name,
        email,
        password: await auth.createHash(user.password),
      };

      let findUser = await authRepository.findByEmail({ email });
      if (findUser) {
        throw new HttpError(400, "Usuário ja cadastrado.");
      }

      await authRepository.create(objectNewUser);

      return { message: "Usuário cadastrado com sucesso." };
    } catch (error: any) {
      if (error instanceof HttpError) throw error;
      throw new HttpError(500, "Erro ao criar usuário.");
    }
  },
  logout: async (request: FastifyRequest) => {
    try {
      const sessao = request.session.get("session");

      if (!sessao) {
        throw new HttpError(401, "Sessão inválida ou expirada.");
      }

      request.session.delete();
      await authRepository.deleteSession({ token: sessao });

      return { message: "Logout realizado com sucesso." };
    } catch (error: any) {
      if (error instanceof HttpError) throw error;
      throw new HttpError(500, "Erro ao realizar logout.");
    }
  },
};
