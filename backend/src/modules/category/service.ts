import { categoryRepository } from "./repository";
import { HttpError } from "@/shared/erros/http-error";
import { DTO } from "./dto";
import { transactionRepository } from "../transactions/repository";

interface categoryServiceInterface {
  findById: (data: findByIdType) => Promise<any>;
  findAll: (data: findAllType) => Promise<any>;
  create: (data: createType) => Promise<any>;
  update: (data: updateType) => Promise<any>;
  delete: (data: deleteType) => Promise<any>;
}

type findByIdType = {
  id: string;
  userId: string;
};

type findAllType = {
  userId: string;
};

type createType = {
  userId: string;
  name: string;
  description?: string | undefined;
  color?: string | undefined;
  icon?: string | undefined;
};

type updateType = {
  id: string;
  userId: string;
  name: string;
  description?: string | undefined;
  color?: string | undefined;
  icon?: string | undefined;
};

type deleteType = {
  id: string;
  userId: string;
};

export const categoryService: categoryServiceInterface = {
  findById: async (data: findByIdType) => {
    try {
      let category = await categoryRepository.findById({
        id: data.id,
        userId: data.userId,
      });

      if (!category) {
        throw new HttpError(404, "Categoria não encontrada.");
      }

      return DTO.category(category);
    } catch (error: any) {
      if (error instanceof HttpError) throw error;
      throw new HttpError(500, "Erro ao buscar categoria.");
    }
  },
  findAll: async (data: findAllType) => {
    try {
      let categories = await categoryRepository.findAllByUserId({
        userId: data.userId,
      });

      return DTO.categories(categories);
    } catch (error: any) {
      if (error instanceof HttpError) throw error;
      throw new HttpError(500, "Erro ao buscar categorias.");
    }
  },
  create: async (data: createType) => {
    try {
      let findCategory = await categoryRepository.findByName({
        name: data.name,
        userId: data.userId,
      });

      if (findCategory) {
        throw new HttpError(400, "Já existe uma categoria com esse nome.");
      }

      let category = await categoryRepository.create({
        userId: data.userId,
        name: data.name,
        description: data.description,
        color: data.color,
        icon: data.icon,
      });

      return { message: "Categoria criada com sucesso." };
    } catch (error: any) {
      if (error instanceof HttpError) throw error;
      throw new HttpError(500, "Erro ao criar categoria.");
    }
  },
  update: async (data: updateType) => {
    try {
      let category = await categoryRepository.findById({
        id: data.id,
        userId: data.userId,
      });

      if (!category) {
        throw new HttpError(404, "Categoria não encontrada.");
      }

      let updatedCategory = await categoryRepository.update(
        { id: data.id, userId: data.userId },
        {
          name: data.name,
          description: data.description,
          color: data.color,
          icon: data.icon,
        },
      );

      return { message: "Categoria atualizada com sucesso." };
    } catch (error: any) {
      if (error instanceof HttpError) throw error;
      throw new HttpError(500, "Erro ao atualizar categoria.");
    }
  },
  delete: async (data: deleteType) => {
    try {
      let category = await categoryRepository.findById({
        id: data.id,
        userId: data.userId,
      });

      if (!category) {
        throw new HttpError(404, "Categoria não encontrada.");
      }

      let categoryHasTransactions =
        await transactionRepository.existsByCategoryId({
          categoryId: data.id,
          userId: data.userId,
        });

      if (categoryHasTransactions) {
        throw new HttpError(
          400,
          "Não é possível excluir a categoria, pois existem transações vinculadas a ela.",
        );
      }

      await categoryRepository.delete({ id: data.id, userId: data.userId });

      return { message: "Categoria excluida com sucesso." };
    } catch (error: any) {
      if (error instanceof HttpError) throw error;
      throw new HttpError(500, "Erro ao deletar categoria.");
    }
  },
};
