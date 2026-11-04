import type { FastifyReply, FastifyRequest } from "fastify";
import { accountService } from "./service";
import { DTO } from "./dto";
import { handleError } from "@/shared/erros/handle-error";
import { accountBodySchema } from "./schema";
import { HttpError } from "@/shared/erros/http-error";
import { assertUuid } from "@/shared/utils/validate";

interface accountController {
  handlerGetAccount: (
    request: FastifyRequest<getAccountType>,
    reply: FastifyReply,
  ) => Promise<any>;
  handlerGetAccounts: (
    request: FastifyRequest,
    reply: FastifyReply,
  ) => Promise<accountType[]>;
  handlerCreateAccount: (
    request: FastifyRequest<accountRequestType>,
    reply: FastifyReply,
  ) => Promise<accountType>;
  handlerUpdateAccount: (
    request: FastifyRequest<updateAccountType>,
    reply: FastifyReply,
  ) => Promise<accountType>;
  handlerDeleteAccount: (
    request: FastifyRequest<deleteAccountType>,
    reply: FastifyReply,
  ) => Promise<accountType>;
}

type getAccountType = {
  Params: {
    id: string;
  };
};

type accountRequestType = {
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

type accountType = {
  id: string;
  userId: string;
  type: string;
};

type userType = {
  id: string;
  name: string;
  email: string;
};

type dataAccount = {
  userId: string;
  name: string;
  type: string;
  accountBalance: number;
};

export const accountController: accountController = {
  handlerGetAccount: async (
    request: FastifyRequest<getAccountType>,
    reply: FastifyReply,
  ) => {
    try {
      let user = request.user as userType;

      if (!user) {
        throw new HttpError(401, "Não autenticado.");
      }

      const id = assertUuid(request.params.id, "ID da conta inválido.");

      let accountUser = await accountService.findById({
        userId: user.id,
        id,
      });

      return reply.code(200).send(accountUser);
    } catch (error: any) {
      return handleError(reply, error);
    }
  },
  handlerGetAccounts: async (
    request: FastifyRequest,
    reply: FastifyReply,
  ): Promise<accountType[]> => {
    try {
      let user = request.user as userType;

      if (!user) {
        throw new HttpError(401, "Não autenticado.");
      }

      let accountUser = await accountService.findAll({
        id: user.id,
        userId: user.id,
      });

      return reply.code(200).send(accountUser);
    } catch (error: any) {
      return handleError(reply, error);
    }
  },
  handlerCreateAccount: async (
    request: FastifyRequest<accountRequestType>,
    reply: FastifyReply,
  ): Promise<accountType> => {
    try {
      let user: userType = request.user as userType;

      if (!user) {
        throw new HttpError(401, "Não autenticado.");
      }

      let parsedBody = accountBodySchema.create.safeParse(request.body);

      if (!parsedBody.success) {
        throw new HttpError(
          400,
          parsedBody.error.issues[0]?.message ?? "Dados inválidos.",
        );
      }

      let data: dataAccount = {
        userId: user.id,
        name: parsedBody.data.name,
        type: parsedBody.data.type,
        accountBalance: parsedBody.data.accountBalance,
      };

      let accountUser = await accountService.create(data);

      return reply.code(200).send(accountUser);
    } catch (error: any) {
      return handleError(reply, error);
    }
  },
  handlerUpdateAccount: async (
    request: FastifyRequest<updateAccountType>,
    reply: FastifyReply,
  ): Promise<accountType> => {
    try {
      let user = request.user as userType;

      if (!user) {
        throw new HttpError(401, "Não autenticado.");
      }

      let idAccount = assertUuid(request.params.id, "ID da conta inválido.");

      let parsedBody = accountBodySchema.update.safeParse(request.body);

      if (!parsedBody.success) {
        throw new HttpError(
          400,
          parsedBody.error.issues[0]?.message ?? "Dados inválidos.",
        );
      }

      let accountUser = await accountService.update({
        id: idAccount,
        userId: user.id,
        data: parsedBody.data,
      });
      return reply.code(200).send(accountUser);
    } catch (error: any) {
      return handleError(reply, error);
    }
  },
  handlerDeleteAccount: async (
    request: FastifyRequest<deleteAccountType>,
    reply: FastifyReply,
  ): Promise<accountType> => {
    try {
      let user = request.user as userType;

      if (!user) {
        throw new HttpError(401, "Não autenticado.");
      }

      const id = assertUuid(request.params.id, "ID da conta inválido.");

      let accountUser = await accountService.delete({
        id: id,
        userId: user.id,
      });
      console.log("accountUser");

      return reply.code(200).send(accountUser);
    } catch (error: any) {
      return handleError(reply, error);
    }
  },
};
