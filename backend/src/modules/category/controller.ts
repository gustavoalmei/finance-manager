import type { FastifyReply, FastifyRequest } from "fastify";
import { categoryService } from "./service";
import { handleError } from "@/shared/erros/handle-error";
import { categoryBodySchema } from "./schema";
import { HttpError } from "@/shared/erros/http-error";

type userType = {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  updatedAt: string;
};

type getCategory = {
  Params: {
    id: string;
  };
};

type createCategory = {
  Body: {
    name: string;
    description?: string;
    color?: string;
    icon?: string;
  };
};

type updateCategory = {
  Params: {
    id: string;
  };
  Body: {
    name: string;
    description?: string;
    color?: string;
    icon?: string;
  };
};

type deleteCategory = {
  Params: {
    id: string;
  };
};

interface categoryInterface {
  getCategory: (
    request: FastifyRequest<getCategory>,
    reply: FastifyReply,
  ) => Promise<any>;
  getAllCategories: (
    request: FastifyRequest,
    reply: FastifyReply,
  ) => Promise<any>;
  create: (
    request: FastifyRequest<createCategory>,
    reply: FastifyReply,
  ) => Promise<any>;
  update: (
    request: FastifyRequest<updateCategory>,
    reply: FastifyReply,
  ) => Promise<any>;
  delete: (
    request: FastifyRequest<deleteCategory>,
    reply: FastifyReply,
  ) => Promise<any>;
}

export const categoryController: categoryInterface = {
  getCategory: async (
    request: FastifyRequest<getCategory>,
    reply: FastifyReply,
  ) => {
    try {
      let user = request.user as userType;

      if (!request.params.id) {
        throw new HttpError(400, "Id da categoria é obrigatório.");
      }

      let category = await categoryService.findById({
        id: request.params.id,
        userId: user.id,
      });

      return reply.code(200).send(category);
    } catch (error) {
      return handleError(reply, error);
    }
  },
  getAllCategories: async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      let user = request.user as userType;

      let categories = await categoryService.findAll({ userId: user.id });

      return reply.code(200).send(categories);
    } catch (error) {
      return handleError(reply, error);
    }
  },
  create: async (request: FastifyRequest<createCategory>, reply: FastifyReply) => {
    try {
      let user = request.user as userType;

      let schemaParsed = categoryBodySchema.create.safeParse(request.body);

      if (!schemaParsed.success) {
        throw new HttpError(
          400,
          schemaParsed.error.issues[0]?.message ?? "Dados inválidos.",
        );
      }

      let category = await categoryService.create({
        userId: user.id,
        name: schemaParsed.data.name,
        description: schemaParsed.data.description,
        color: schemaParsed.data.color,
        icon: schemaParsed.data.icon,
      });

      return reply.code(200).send(category);
    } catch (error) {
      return handleError(reply, error);
    }
  },
  update: async (request: FastifyRequest<updateCategory>, reply: FastifyReply) => {
    try {
      let user = request.user as userType;

      if (!request.params.id) {
        throw new HttpError(400, "Id da categoria é obrigatório.");
      }

      let schemaParsed = categoryBodySchema.update.safeParse(request.body);

      if (!schemaParsed.success) {
        throw new HttpError(
          400,
          schemaParsed.error.issues[0]?.message ?? "Dados inválidos.",
        );
      }

      let category = await categoryService.update({
        id: request.params.id,
        userId: user.id,
        name: schemaParsed.data.name,
        description: schemaParsed.data.description,
        color: schemaParsed.data.color,
        icon: schemaParsed.data.icon,
      });

      return reply.code(200).send(category);
    } catch (error) {
      return handleError(reply, error);
    }
  },
  delete: async (request: FastifyRequest<deleteCategory>, reply: FastifyReply) => {
    try {
      let user = request.user as userType;

      if (!request.params.id) {
        throw new HttpError(400, "Id da categoria é obrigatório.");
      }

      let category = await categoryService.delete({
        id: request.params.id,
        userId: user.id,
      });

      return reply.code(200).send(category);
    } catch (error) {
      return handleError(reply, error);
    }
  },
};
