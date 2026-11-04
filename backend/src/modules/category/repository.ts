import { prisma } from "@/app/plugins/database";

interface categoryRepositoryInterface {
  findById: (data: findByIdType) => Promise<any>;
  findAllByUserId: (data: findAllByUserIdType) => Promise<any>;
  findByName: (data: findByNameType) => Promise<any>;
  create: (data: createType) => Promise<any>;
  delete: (data: findByIdType) => Promise<any>;
  update: (data: findByIdType, fields: updateType) => Promise<any>;
}

type findByIdType = {
  id: string;
  userId: string;
};

type findAllByUserIdType = {
  userId: string;
};

type findByNameType = {
  name: string;
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
  name: string;
  description?: string | undefined;
  color?: string | undefined;
  icon?: string | undefined;
};

export const categoryRepository: categoryRepositoryInterface = {
  findById: async (data: findByIdType) => {
    return await prisma.category.findFirst({
      where: { id: data.id, userId: data.userId },
    });
  },
  findAllByUserId: async (data: findAllByUserIdType) => {
    return await prisma.category.findMany({
      where: { userId: data.userId },
      orderBy: { createdAt: "asc" },
    });
  },
  findByName: async (data: findByNameType) => {
    return await prisma.category.findFirst({
      where: { name: data.name, userId: data.userId },
    });
  },
  create: async (data: createType) => {
    return await prisma.category.create({
      // sem cor/ícone: ficam os defaults do banco
      data: {
        userId: data.userId,
        name: data.name,
        description: data.description ?? null,
        ...(data.color && { color: data.color }),
        ...(data.icon && { icon: data.icon }),
      },
    });
  },
  delete: async (data: findByIdType) => {
    return await prisma.category.delete({
      where: { id: data.id, userId: data.userId },
    });
  },
  update: async (data: findByIdType, fields: updateType) => {
    return await prisma.category.update({
      where: { id: data.id, userId: data.userId },
      data: {
        name: fields.name,
        description: fields.description ?? null,
        ...(fields.color && { color: fields.color }),
        ...(fields.icon && { icon: fields.icon }),
      },
    });
  },
};
