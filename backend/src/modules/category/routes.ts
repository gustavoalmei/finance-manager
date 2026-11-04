import type { FastifyInstance } from "fastify";
import { categoryController } from "./controller";

type getCategory = {
  Params: {
    id: string;
  };
};

type deleteCategory = {
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

export default async function routes(fastify: FastifyInstance) {
  fastify.get<getCategory>(
    "/category/:id",
    { preHandler: fastify.authenticate },
    categoryController.getCategory,
  );
  fastify.get(
    "/categories",
    { preHandler: fastify.authenticate },
    categoryController.getAllCategories,
  );
  fastify.post<createCategory>(
    "/category",
    { preHandler: fastify.authenticate },
    categoryController.create,
  );
  fastify.put<updateCategory>(
    "/category/:id",
    { preHandler: fastify.authenticate },
    categoryController.update,
  );
  fastify.delete<deleteCategory>(
    "/category/:id",
    { preHandler: fastify.authenticate },
    categoryController.delete,
  );
}
