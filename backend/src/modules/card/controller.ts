import { handleError } from "@/shared/erros/handle-error";
import { HttpError } from "@/shared/erros/http-error";
import type { FastifyReply, FastifyRequest } from "fastify";
import { cardBodySchema } from "./schema";
import { cardService } from "./service";

type userType = {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  updatedAt: string;
};

export type getCard = {
  Params: {
    id: string;
  };
};

export type createCard = {
  Body: {
    accountId: string;
    name: string;
    description?: string;
    brand: string;
    lastFourDigits: string;
    creditLimit: string;
    closingDay: number;
    dueDay: number;
  };
};

export type updateCard = {
  Params: {
    id: string;
  };
  Body: {
    name: string;
    description?: string;
    brand: string;
    lastFourDigits: string;
    creditLimit: string;
    closingDay: number;
    dueDay: number;
  };
};

export type deleteCard = {
  Params: {
    id: string;
  };
};

interface cardInterface {
  getCard: (
    request: FastifyRequest<getCard>,
    reply: FastifyReply,
  ) => Promise<any>;
  getAllCards: (request: FastifyRequest, reply: FastifyReply) => Promise<any>;
  create: (
    request: FastifyRequest<createCard>,
    reply: FastifyReply,
  ) => Promise<any>;
  update: (
    request: FastifyRequest<updateCard>,
    reply: FastifyReply,
  ) => Promise<any>;
  delete: (
    request: FastifyRequest<deleteCard>,
    reply: FastifyReply,
  ) => Promise<any>;
}

export const controllerCard: cardInterface = {
  getCard: async (request: FastifyRequest<getCard>, reply: FastifyReply) => {
    try {
      let user = request.user as userType;

      if (!request.params.id) {
        throw new HttpError(400, "Id do cartão é obrigatório.");
      }

      let card = await cardService.findByID({
        id: request.params.id,
        userId: user.id,
      });

      return reply.code(200).send(card);
    } catch (error) {
      return handleError(reply, error);
    }
  },
  getAllCards: async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      let user = request.user as userType;

      let cards = await cardService.findAll({ userId: user.id });

      return reply.code(200).send(cards);
    } catch (error) {
      return handleError(reply, error);
    }
  },
  create: async (request: FastifyRequest<createCard>, reply: FastifyReply) => {
    try {
      let user = request.user as userType;

      let schemaParsed = cardBodySchema.create.safeParse(request.body);

      if (!schemaParsed.success) {
        throw new HttpError(
          400,
          schemaParsed.error.issues[0]?.message ?? "Dados inválidos.",
        );
      }

      let objectCreate = {
        ...schemaParsed.data,
        userId: user.id,
      };

      let req = await cardService.create(objectCreate);

      return reply.code(200).send(req);
    } catch (error) {
      return handleError(reply, error);
    }
  },
  update: async (request: FastifyRequest<updateCard>, reply: FastifyReply) => {
    try {
      let user = request.user as userType;

      if (!request.params.id) {
        throw new HttpError(400, "Id do cartão é obrigatório.");
      }

      let schemaParsed = cardBodySchema.update.safeParse(request.body);

      if (!schemaParsed.success) {
        throw new HttpError(
          400,
          schemaParsed.error.issues[0]?.message ?? "Dados inválidos.",
        );
      }

      let req = await cardService.update({
        ...schemaParsed.data,
        id: request.params.id,
        userId: user.id,
      });

      return reply.code(200).send(req);
    } catch (error) {
      return handleError(reply, error);
    }
  },
  delete: async (request: FastifyRequest<deleteCard>, reply: FastifyReply) => {
    try {
      let user = request.user as userType;

      if (!request.params.id) {
        throw new HttpError(400, "Id do cartão é obrigatório.");
      }

      let req = await cardService.delete({
        id: request.params.id,
        userId: user.id,
      });

      return reply.code(200).send(req);
    } catch (error) {
      return handleError(reply, error);
    }
  },
};
