import { prisma } from "@/app/plugins/database";
import type { Prisma } from "@/generated/prisma/client";
import type { Period } from "@/shared/utils/date";

// conta ou cartão selecionado; vazio = todas as contas
export type Scope = { accountId?: string; cardId?: string };

type periodQueryType = {
  userId: string;
  period: Period;
  scope: Scope;
};

type transfersQueryType = {
  userId: string;
  period: Period;
  accountId: string;
};

type listQueryType = {
  userId: string;
  scope: Scope;
  take: number;
};

// campos que os widgets de lista mostram
const listSelect = {
  id: true,
  description: true,
  type: true,
  status: true,
  amount: true,
  date: true,
  categoryId: true,
  accountId: true,
  cardId: true,
  installmentNumber: true,
  totalInstallments: true,
} as const;

type upsertLayoutType = {
  userId: string;
  widgets: Prisma.InputJsonValue;
};

// Filtro comum: transações vivas do usuário dentro do período (fim inclusivo,
// como no filtro de transações). Usa o índice [userId, date].
const inPeriod = ({ userId, period, scope }: periodQueryType) => ({
  userId,
  ...scope,
  deletedAt: null,
  date: { gte: period.start, lte: period.end },
});

interface dashboardRepositoryInterface {
  sumByTypeAndStatus: (data: periodQueryType) => Promise<any[]>;
  sumByDate: (data: periodQueryType) => Promise<any[]>;
  sumExpensesByCategory: (data: periodQueryType) => Promise<any[]>;
  sumExpensesByCard: (data: periodQueryType) => Promise<any[]>;
  sumTransfers: (
    data: transfersQueryType,
  ) => Promise<{ incoming: number; outgoing: number }>;
  findRecent: (
    data: listQueryType & { period: Period },
  ) => Promise<any[]>;
  findPendingBills: (data: listQueryType) => Promise<any[]>;
  hasTransactions: (userId: string) => Promise<boolean>;
  findMonthStartDay: (userId: string) => Promise<number>;
  findLayout: (userId: string) => Promise<any>;
  upsertLayout: (data: upsertLayoutType) => Promise<any>;
}

export const dashboardRepository: dashboardRepositoryInterface = {
  // Receita/despesa confirmadas e pendentes. Transferência não é receita nem despesa.
  sumByTypeAndStatus: async (data: periodQueryType) => {
    const rows = await prisma.transaction.groupBy({
      by: ["type", "status"],
      _sum: { amount: true },
      where: {
        ...inPeriod(data),
        type: { in: ["INCOME", "EXPENSE"] },
        status: { in: ["CONFIRMED", "PENDING"] },
      },
    });
    return rows;
  },
  // Lançamentos são salvos à meia-noite UTC: agrupar por data = agrupar por dia
  sumByDate: async (data: periodQueryType) => {
    const rows = await prisma.transaction.groupBy({
      by: ["date", "type"],
      _sum: { amount: true },
      where: {
        ...inPeriod(data),
        type: { in: ["INCOME", "EXPENSE"] },
        status: "CONFIRMED",
      },
    });
    return rows;
  },
  sumExpensesByCategory: async (data: periodQueryType) => {
    const rows = await prisma.transaction.groupBy({
      by: ["categoryId"],
      _sum: { amount: true },
      where: { ...inPeriod(data), type: "EXPENSE", status: "CONFIRMED" },
    });
    return rows;
  },
  sumExpensesByCard: async (data: periodQueryType) => {
    const rows = await prisma.transaction.groupBy({
      by: ["cardId"],
      _sum: { amount: true },
      where: {
        ...inPeriod(data),
        type: "EXPENSE",
        status: "CONFIRMED",
        cardId: { not: null },
      },
    });
    return rows;
  },
  // Transferências confirmadas que entraram/saíram da conta: mudam o saldo,
  // mas não são receita nem despesa. A origem fica em sourceAccountId
  // (ou em accountId, nos lançamentos sem origem preenchida).
  sumTransfers: async ({ userId, period, accountId }: transfersQueryType) => {
    const base = {
      userId,
      type: "TRANSFER" as const,
      status: "CONFIRMED" as const,
      deletedAt: null,
      date: { gte: period.start, lte: period.end },
    };
    const [incoming, outgoing] = await Promise.all([
      prisma.transaction.aggregate({
        _sum: { amount: true },
        where: { ...base, destinationAccountId: accountId },
      }),
      prisma.transaction.aggregate({
        _sum: { amount: true },
        where: {
          ...base,
          OR: [
            { sourceAccountId: accountId },
            { sourceAccountId: null, accountId },
          ],
        },
      }),
    ]);
    return {
      incoming: incoming._sum.amount ?? 0,
      outgoing: outgoing._sum.amount ?? 0,
    };
  },
  // Mais recentes do período, sem as futuras (parcelas já lançadas para os próximos meses)
  findRecent: async ({ userId, scope, take, period }) => {
    const now = new Date();
    return await prisma.transaction.findMany({
      where: {
        ...inPeriod({ userId, period, scope }),
        date: {
          gte: period.start,
          lte: period.end < now ? period.end : now,
        },
        status: { not: "CANCELLED" },
      },
      orderBy: [{ date: "desc" }, { createdAt: "desc" }],
      select: listSelect,
      take,
    });
  },
  // Contas a pagar/receber: pendentes fora do cartão (compra no cartão é paga
  // pela fatura), da mais antiga (atrasada) para a mais distante
  findPendingBills: async ({ userId, scope, take }) => {
    return await prisma.transaction.findMany({
      where: {
        userId,
        ...scope,
        deletedAt: null,
        status: "PENDING",
        type: { in: ["INCOME", "EXPENSE"] },
        cardId: null,
      },
      orderBy: [{ date: "asc" }, { createdAt: "asc" }],
      select: listSelect,
      take,
    });
  },
  hasTransactions: async (userId: string) => {
    const transaction = await prisma.transaction.findFirst({
      where: { userId, deletedAt: null },
      select: { id: true },
    });
    return transaction !== null;
  },
  findMonthStartDay: async (userId: string) => {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { monthStartDay: true },
    });
    return user?.monthStartDay ?? 1;
  },
  findLayout: async (userId: string) => {
    return await prisma.dashboardLayout.findUnique({
      where: { userId },
    });
  },
  upsertLayout: async ({ userId, widgets }: upsertLayoutType) => {
    return await prisma.dashboardLayout.upsert({
      where: { userId },
      create: { userId, widgets },
      update: { widgets },
    });
  },
};
