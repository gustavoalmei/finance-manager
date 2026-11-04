import { prisma } from "@/app/plugins/database";

type findByIdType = {
  id: string;
  userId: string;
};

type findAllByUserIdType = {
  id: string;
};
type createType = {
  userId: string;
  name: string;
  type: string;
  accountBalance: number;
};
type deleteType = {
  id: string;
  userId: string;
};
type updateType = {
  id: string;
  userId: string;
  data: {
    name: string;
    type: string;
    accountBalance: number;
  };
};

interface accountRepositoryInterface {
  findById: (data: findByIdType) => Promise<any>;
  findAllByUserId: (data: findAllByUserIdType) => Promise<any>;
  create: (data: createType) => Promise<any>;
  delete: (data: deleteType) => Promise<any>;
  update: (data: updateType) => Promise<any>;
}

export const accountRepository: accountRepositoryInterface = {
  findById: async (data: findByIdType) => {
    return await prisma.account.findUnique({
      where: { id: data.id, userId: data.userId },
    });
  },
  findAllByUserId: async (data: findAllByUserIdType) => {
    return await prisma.account.findMany({
      where: { userId: data.id },
      orderBy: { name: "asc" },
    });
  },
  create: async (data: createType) => {
    return await prisma.account.create({
      data,
    });
  },
  delete: async (data: deleteType) => {
    return await prisma.account.delete({
      where: { id: data.id, userId: data.userId },
    });
  },
  update: async (data: updateType) => {
    return await prisma.account.update({
      where: { id: data.id, userId: data.userId },
      data: {
        name: data.data.name,
        type: data.data.type,
        accountBalance: data.data.accountBalance,
      },
    });
  },
};
