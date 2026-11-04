import { prisma } from "@/app/plugins/database";
import { applyBalanceChanges, balanceChanges, revertChanges } from "./balance";

type createTransactionType = {
  // só a importação informa: parcelas precisam do id da 1ª no mesmo createMany
  id?: string;
  userId: string;
  categoryId: string;
  accountId: string;
  type: "INCOME" | "EXPENSE" | "TRANSFER";
  status: "PENDING" | "CONFIRMED" | "CANCELLED";
  amount: number;
  description: string;
  date: Date;
  isRecurring: true | false;
  cardId?: string;
  parentTransactionId?: string;
  installmentNumber?: number;
  totalInstallments?: number;
};

type updateTransactionType = {
  id: string;
  userId: string;
  data: {
    // só em lançamento fora do cartão
    accountId?: string;
    categoryId: string;
    type: "INCOME" | "EXPENSE" | "TRANSFER";
    status: "PENDING" | "CONFIRMED" | "CANCELLED";
    amount: number;
    description: string;
    date: Date;
    isRecurring: true | false;
    installmentNumber?: number;
    totalInstallments?: number;
  };
};

type deleteTransactionType = {
  id: string;
  userId: string;
};

type deleteManyType = {
  userId: string;
  id: string[];
};

type findByIdType = {
  userId: string;
  id: string;
};

type findByCardIdType = {
  userId: string;
  id: string;
};

type existsByCategoryIdType = {
  userId: string;
  categoryId: string;
};

type objectTransfer = {
  categoryId: string;
  sourceAccountId: string;
  destinationAccountId: string;
  amount: number;
  userId: string;
  accountId: string;
  type: "TRANSFER";
  status: "PENDING" | "CONFIRMED" | "CANCELLED";
  date: Date;
  description: string;
  isRecurring: true | false;
};

type getAlltransactionsType = {
  userId: string;
  filters: {
    period?: [string, string] | undefined;
    status?: "PENDING" | "CONFIRMED" | "CANCELLED" | undefined;
    categoryId?: string | undefined;
    type?: "INCOME" | "EXPENSE" | "TRANSFER" | undefined;
    isRecurring?: boolean | undefined;
    accountId?: string | undefined;
    cardId?: string | undefined;
  };
};

interface transactionRepositoryInterface {
  findById: (data: findByIdType) => Promise<any>;
  create: (data: createTransactionType) => Promise<any>;
  createMany: (data: createTransactionType[]) => Promise<any>;
  delete: (data: deleteTransactionType) => Promise<any>;
  deleteMany: (data: deleteManyType) => Promise<any>;
  update: (data: updateTransactionType) => Promise<any>;
  findParentTransactionById: (id: string) => Promise<any>;
  findByParentTransactionId: (data: deleteTransactionType) => Promise<any>;
  findByCardId: (data: findByCardIdType) => Promise<any>;
  existsByCategoryId: (data: existsByCategoryIdType) => Promise<boolean>;
  getAllTransactions: (data: getAlltransactionsType) => Promise<any>;
  transfer: (data: objectTransfer) => Promise<any>;
}

export const transactionRepository: transactionRepositoryInterface = {
  findById: async (data: findByIdType) => {
    return await prisma.transaction.findUnique({
      where: { id: data.id, userId: data.userId },
    });
  },
  // Todas as escritas abaixo ajustam o saldo das contas na mesma transação do banco
  create: async (data: createTransactionType) => {
    return await prisma.$transaction(async (tx) => {
      const transaction = await tx.transaction.create({ data });
      await applyBalanceChanges(tx, balanceChanges(transaction));
      return transaction;
    });
  },
  createMany: async (data: createTransactionType[]) => {
    return await prisma.$transaction(async (tx) => {
      const result = await tx.transaction.createMany({ data });
      await applyBalanceChanges(tx, data.flatMap(balanceChanges));
      return result;
    });
  },
  delete: async (data: deleteTransactionType) => {
    return await prisma.$transaction(async (tx) => {
      const transaction = await tx.transaction.delete({
        where: { id: data.id, userId: data.userId },
      });
      await applyBalanceChanges(tx, revertChanges(balanceChanges(transaction)));
      return transaction;
    });
  },
  deleteMany: async (data: deleteManyType) => {
    return await prisma.$transaction(async (tx) => {
      const where = { id: { in: data.id }, userId: data.userId };
      const transactions = await tx.transaction.findMany({ where });
      const result = await tx.transaction.deleteMany({ where });
      await applyBalanceChanges(
        tx,
        revertChanges(transactions.flatMap(balanceChanges)),
      );
      return result;
    });
  },
  // desfaz o efeito da versão antiga e aplica o da nova (valor, status, tipo ou conta)
  update: async ({ id, userId, data }: updateTransactionType) => {
    return await prisma.$transaction(async (tx) => {
      const previous = await tx.transaction.findUniqueOrThrow({
        where: { id, userId },
      });
      const transaction = await tx.transaction.update({
        where: { id },
        data,
      });
      await applyBalanceChanges(tx, [
        ...revertChanges(balanceChanges(previous)),
        ...balanceChanges(transaction),
      ]);
      return transaction;
    });
  },
  findParentTransactionById: async (id: string) => {
    return await prisma.transaction.findFirst({
      where: { parentTransactionId: id },
    });
  },
  findByParentTransactionId: async (data: deleteTransactionType) => {
    return await prisma.transaction.findMany({
      where: { parentTransactionId: data.id, userId: data.userId },
    });
  },
  findByCardId: async (data: findByCardIdType) => {
    return await prisma.transaction.findMany({
      where: { cardId: data.id, userId: data.userId },
    });
  },
  // Só precisa saber se existe: findFirst para na primeira linha encontrada.
  // Inclui transações com deletedAt, pois a FK continua apontando para a categoria.
  existsByCategoryId: async (data: existsByCategoryIdType) => {
    const transaction = await prisma.transaction.findFirst({
      where: { categoryId: data.categoryId, userId: data.userId },
      select: { id: true },
    });
    return transaction !== null;
  },
  getAllTransactions: async (data: getAlltransactionsType) => {
    let { period, ...rest } = data.filters;

    let filters = Object.fromEntries(
      Object.entries(rest).filter(([, value]) => value !== undefined),
    );

    return await prisma.transaction.findMany({
      where: {
        userId: data.userId,
        ...filters,
        ...(period && {
          date: {
            gte: new Date(period[0]),
            lte: new Date(period[1]),
          },
        }),
      },
    });
  },
  transfer: async (data: objectTransfer) => {
    return await prisma.$transaction(async (tx) => {
      const transaction = await tx.transaction.create({ data });
      await applyBalanceChanges(tx, balanceChanges(transaction));
      return transaction;
    });
  },
};
