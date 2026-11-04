import { prisma } from "@/app/plugins/database";
import type { CardBody } from "./schema";
import type { Card } from "@/generated/prisma/client";

export type CardSumRow = {
  cardId: string | null;
  type: string;
  _sum: { amount: number | null };
};

type sumByCardType = {
  userId: string;
  cardIds: string[];
  // sem período: soma tudo (limite usado inclui parcelas futuras)
  period?: { start: Date; end: Date };
};

interface cardRepositoryInterface {
  create: (data: createType) => Promise<any>;
  getAll: (data: getAllType) => Promise<Card[]>;
  sumByCard: (data: sumByCardType) => Promise<CardSumRow[]>;
  update: (data: updateType) => Promise<any>;
  delete: (data: deleteType) => Promise<any>;
  findByName: (data: findByNameType) => Promise<any>;
  findById: (data: findByIdType) => Promise<any>;
}

type createType = CardBody & {
  userId: string;
  accountId: string;
};

type getAllType = {
  userId: string;
};

type updateType = CardBody & {
  id: string;
  userId: string;
};

type deleteType = {
  id: string;
  userId: string;
};

type findByNameType = {
  name: string;
  userId: string;
};

type findByIdType = {
  id: string;
  userId: string;
};

export const cardRepository: cardRepositoryInterface = {
  create: async (data: createType) => {
    return await prisma.card.create({
      data: {
        ...data,
        description: data.description ?? null,
      },
    });
  },
  getAll: async (data: getAllType) => {
    return await prisma.card.findMany({
      where: {
        userId: data.userId,
        deletedAt: null,
      },
      orderBy: { name: "asc" },
    });
  },
  // Uma consulta para todos os cartões; usa o índice [cardId, date].
  // EXPENSE = compras · TRANSFER = pagamentos de fatura. PENDING também conta.
  sumByCard: async ({ userId, cardIds, period }: sumByCardType) => {
    const rows = await prisma.transaction.groupBy({
      by: ["cardId", "type"],
      _sum: { amount: true },
      where: {
        userId,
        cardId: { in: cardIds },
        type: { in: ["EXPENSE", "TRANSFER"] },
        status: { not: "CANCELLED" },
        deletedAt: null,
        ...(period && { date: { gte: period.start, lt: period.end } }),
      },
    });
    return rows;
  },
  update: async (data: updateType) => {
    return await prisma.card.update({
      where: {
        id: data.id,
        userId: data.userId,
      },
      data: {
        name: data.name,
        description: data.description ?? null,
        brand: data.brand,
        lastFourDigits: data.lastFourDigits,
        creditLimit: data.creditLimit,
        closingDay: data.closingDay,
        dueDay: data.dueDay,
        userId: data.userId,
      },
    });
  },
  delete: async (data: deleteType) => {
    return await prisma.card.delete({
      where: {
        id: data.id,
        userId: data.userId,
      },
    });
  },
  findByName: async (data: findByNameType) => {
    return await prisma.card.findFirst({
      where: {
        name: data.name,
        userId: data.userId,
      },
    });
  },
  findById: async (data: findByIdType) => {
    return await prisma.card.findFirst({
      where: {
        id: data.id,
        userId: data.userId,
      },
    });
  },
};
