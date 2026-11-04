import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { accountController } from "./controller";

type accountType = {
  Body: {
    name: string;
    type: string;
    accountBalance: number;
  };
};
type deleteAccountType = {
  Params: {
    id: string;
  };
};
type updateAccountType = {
  Params: {
    id: string;
  };
  Body: {
    name: string;
    type: string;
    accountBalance: number;
  };
};
type getAccountType = {
  Params: {
    id: string;
  };
};

export default async function routes(fastify: FastifyInstance) {
  fastify.get<getAccountType>(
    "/account/:id",
    { preHandler: fastify.authenticate },
    accountController.handlerGetAccount,
  );
  fastify.get(
    "/accounts",
    { preHandler: fastify.authenticate },
    accountController.handlerGetAccounts,
  );
  fastify.post<accountType>(
    "/account",
    { preHandler: fastify.authenticate },
    accountController.handlerCreateAccount,
  );
  fastify.delete<deleteAccountType>(
    "/account/:id",
    { preHandler: fastify.authenticate },
    accountController.handlerDeleteAccount,
  );
  fastify.put<updateAccountType>(
    "/account/:id",
    { preHandler: fastify.authenticate },
    accountController.handlerUpdateAccount,
  );
}
