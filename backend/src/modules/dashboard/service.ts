import { HttpError } from "@/shared/erros/http-error";
import {
  bucketKey,
  getBillingCycle,
  getBuckets,
  getGranularity,
  getPreviousPeriod,
} from "@/shared/utils/date";
import type { Period } from "@/shared/utils/date";
import { accountRepository } from "../account/repository";
import { cardRepository } from "../card/repository";
import { cardService } from "../card/service";
import { categoryRepository } from "../category/repository";
import { dashboardRepository } from "./repository";
import type { Scope } from "./repository";
import type { Widget } from "./schema";

type summaryType = {
  userId: string;
  from: string;
  to: string;
  accountId?: string | undefined;
  cardId?: string | undefined;
};

type saveLayoutType = {
  userId: string;
  widgets: Widget[];
};

type SumRow = {
  type: string;
  status?: string;
  _sum: { amount: number | null };
};

// próximas faturas exibidas além da atual
const UPCOMING_INVOICES = 3;
// itens das listas de transações recentes e de contas a pagar/receber
const LIST_SIZE = 6;

interface dashboardServiceInterface {
  summary: (data: summaryType) => Promise<any>;
  getLayout: (userId: string) => Promise<{ widgets: Widget[] | null }>;
  saveLayout: (data: saveLayoutType) => Promise<{ widgets: Widget[] }>;
}

const sumOf = (rows: SumRow[], type: string, status = "CONFIRMED") =>
  rows
    .filter((row) => row.type === type && row.status === status)
    .reduce((total, row) => total + (row._sum.amount ?? 0), 0);

const totalsOf = (rows: SumRow[]) => {
  const income = sumOf(rows, "INCOME");
  const expense = sumOf(rows, "EXPENSE");
  return {
    income,
    expense,
    result: income - expense,
    pendingIncome: sumOf(rows, "INCOME", "PENDING"),
    pendingExpense: sumOf(rows, "EXPENSE", "PENDING"),
  };
};

// Faturas seguintes à atual: cada ciclo começa no dia seguinte ao fechamento anterior.
// Mesmo cálculo da fatura atual do cartão (compras não canceladas, inclusive pendentes).
const upcomingInvoices = async (userId: string, card: any) => {
  const cycles = [];
  let reference = new Date(card.currentInvoice.closingDate);
  for (let i = 0; i < UPCOMING_INVOICES; i++) {
    // fechamento + 1 dia cai no ciclo seguinte
    reference = new Date(reference.getTime() + 86_400_000);
    const cycle = getBillingCycle(card.closingDay, card.dueDay, reference);
    cycles.push(cycle);
    reference = cycle.closingDate;
  }

  return await Promise.all(
    cycles.map(async (cycle) => {
      const rows = await cardRepository.sumByCard({
        userId,
        cardIds: [card.id],
        period: cycle,
      });
      const amount =
        rows.find((row) => row.type === "EXPENSE")?._sum.amount ?? 0;
      return {
        amount,
        closingDate: cycle.closingDate,
        dueDate: cycle.dueDate,
      };
    }),
  );
};

export const dashboardService: dashboardServiceInterface = {
  summary: async (data: summaryType) => {
    try {
      const period: Period = {
        start: new Date(data.from),
        end: new Date(data.to),
      };
      const previousPeriod = getPreviousPeriod(period);
      const granularity = getGranularity(period);
      // cartão tem prioridade (igual à tela de transações)
      const scope: Scope = data.cardId
        ? { cardId: data.cardId }
        : data.accountId
          ? { accountId: data.accountId }
          : {};
      const query = { userId: data.userId, period, scope };

      // tudo independente: em paralelo
      const [
        totalsRows,
        previousRows,
        dateRows,
        categoryRows,
        cardRows,
        previousCategoryRows,
        recentRows,
        pendingRows,
        allAccounts,
        categories,
        allCards,
        hasTransactions,
        monthStartDay,
      ] = await Promise.all([
        dashboardRepository.sumByTypeAndStatus(query),
        dashboardRepository.sumByTypeAndStatus({
          userId: data.userId,
          period: previousPeriod,
          scope,
        }),
        dashboardRepository.sumByDate(query),
        dashboardRepository.sumExpensesByCategory(query),
        dashboardRepository.sumExpensesByCard(query),
        // ranking compara cada categoria com o período anterior
        dashboardRepository.sumExpensesByCategory({
          userId: data.userId,
          period: previousPeriod,
          scope,
        }),
        dashboardRepository.findRecent({ ...query, take: LIST_SIZE }),
        // cartão não tem conta a pagar própria: a fatura já aparece em Faturas
        scope.cardId
          ? Promise.resolve([])
          : dashboardRepository.findPendingBills({
              userId: data.userId,
              scope,
              take: LIST_SIZE,
            }),
        accountRepository.findAllByUserId({ id: data.userId }),
        categoryRepository.findAllByUserId({ userId: data.userId }),
        cardService.findAll({ userId: data.userId }),
        // onboarding é global: diz se o usuário já usa o sistema, não a conta
        dashboardRepository.hasTransactions(data.userId),
        // agrupamento mensal da evolução segue o mês financeiro do usuário
        dashboardRepository.findMonthStartDay(data.userId),
      ]);

      // Só no escopo de conta: em "todas" as transferências entre contas próprias
      // se anulam, e cartão não recebe transferência
      const transfers = scope.accountId
        ? await dashboardRepository.sumTransfers({
            userId: data.userId,
            period,
            accountId: scope.accountId,
          })
        : null;

      // cartão selecionado: só ele e a conta dele · conta: ela e os cartões dela
      const cards = allCards.filter((card: any) =>
        scope.cardId
          ? card.id === scope.cardId
          : !scope.accountId || card.accountId === scope.accountId,
      );
      const scopeAccountId = scope.cardId ? cards[0]?.accountId : scope.accountId;
      const accounts = scopeAccountId
        ? allAccounts.filter((account: any) => account.id === scopeAccountId)
        : allAccounts;

      // série completa: dias/meses sem lançamento aparecem zerados
      const evolution = new Map(
        getBuckets(period, granularity, monthStartDay).map((key) => [
          key,
          { bucket: key, income: 0, expense: 0 },
        ]),
      );
      for (const row of dateRows) {
        const point = evolution.get(
          bucketKey(row.date, granularity, monthStartDay),
        );
        if (!point) continue;
        if (row.type === "INCOME") point.income += row._sum.amount ?? 0;
        if (row.type === "EXPENSE") point.expense += row._sum.amount ?? 0;
      }

      const categoryById = new Map<string, any>(
        categories.map((category: any) => [category.id, category]),
      );
      const previousByCategory = new Map(
        previousCategoryRows.map((row) => [
          row.categoryId,
          row._sum.amount ?? 0,
        ]),
      );
      const expensesByCategory = categoryRows
        .map((row) => {
          const category = categoryById.get(row.categoryId);
          return {
            categoryId: row.categoryId,
            name: category?.name ?? "Sem categoria",
            color: category?.color ?? "blue",
            icon: category?.icon ?? "tag",
            amount: row._sum.amount ?? 0,
            previousAmount: previousByCategory.get(row.categoryId) ?? 0,
          };
        })
        .sort((a, b) => b.amount - a.amount);

      // nomes para as listas: categoria + de onde saiu (cartão ou conta)
      const accountNameById = new Map<string, string>(
        allAccounts.map((account: any) => [account.id, account.name]),
      );
      const cardNameById = new Map<string, string>(
        allCards.map((card: any) => [card.id, card.name]),
      );
      const toListItem = (row: any) => {
        const category = categoryById.get(row.categoryId);
        return {
          id: row.id,
          description: row.description,
          type: row.type,
          status: row.status,
          amount: row.amount,
          date: row.date,
          installmentNumber: row.installmentNumber,
          totalInstallments: row.totalInstallments,
          category: {
            name: category?.name ?? "Sem categoria",
            color: category?.color ?? "blue",
            icon: category?.icon ?? "tag",
          },
          source: row.cardId
            ? `Cartão ${cardNameById.get(row.cardId) ?? ""}`.trim()
            : (accountNameById.get(row.accountId) ?? "—"),
        };
      };

      const cardById = new Map<string, any>(
        cards.map((card: any) => [card.id, card]),
      );
      const spendingByCard = cardRows
        .map((row) => {
          const card = cardById.get(row.cardId);
          return {
            cardId: row.cardId,
            name: card?.name ?? "Cartão excluído",
            brand: card?.brand ?? "OTHER",
            amount: row._sum.amount ?? 0,
          };
        })
        .sort((a, b) => b.amount - a.amount);

      const invoices = await Promise.all(
        cards.map(async (card: any) => ({
          cardId: card.id,
          name: card.name,
          brand: card.brand,
          // para o visual de cartão no front
          lastFourDigits: card.lastFourDigits,
          dueDay: card.dueDay,
          creditLimit: card.creditLimit,
          usedCredit: card.usedCredit,
          current: {
            amount: card.currentInvoice.amount,
            closingDate: card.currentInvoice.closingDate,
            dueDate: card.currentInvoice.dueDate,
          },
          upcoming: await upcomingInvoices(data.userId, card),
        })),
      );

      const accountBalances = accounts.map((account: any) => ({
        id: account.id,
        name: account.name,
        type: account.type,
        balance: account.accountBalance,
      }));

      const { pendingIncome, pendingExpense, ...previousTotals } =
        totalsOf(previousRows);

      return {
        period: { ...period, granularity, monthStartDay },
        previousPeriod,
        totals: totalsOf(totalsRows),
        previousTotals,
        transfers,
        evolution: [...evolution.values()],
        expensesByCategory,
        spendingByCard,
        balance: {
          total: accountBalances.reduce(
            (total: number, account: any) => total + account.balance,
            0,
          ),
          accounts: accountBalances,
        },
        invoices,
        recentTransactions: recentRows.map(toListItem),
        pendingBills: pendingRows.map(toListItem),
        onboarding: {
          hasAccount: allAccounts.length > 0,
          hasCategory: categories.length > 0,
          hasCard: allCards.length > 0,
          hasTransaction: hasTransactions,
        },
      };
    } catch (error: any) {
      if (error instanceof HttpError) throw error;
      throw new HttpError(500, "Erro ao carregar o resumo.");
    }
  },
  getLayout: async (userId: string) => {
    try {
      const layout = await dashboardRepository.findLayout(userId);
      // null: o front usa o layout padrão
      return { widgets: (layout?.widgets as Widget[] | undefined) ?? null };
    } catch (error: any) {
      if (error instanceof HttpError) throw error;
      throw new HttpError(500, "Erro ao carregar o layout.");
    }
  },
  saveLayout: async ({ userId, widgets }: saveLayoutType) => {
    try {
      await dashboardRepository.upsertLayout({ userId, widgets });
      return { widgets };
    } catch (error: any) {
      if (error instanceof HttpError) throw error;
      throw new HttpError(500, "Erro ao salvar o layout.");
    }
  },
};
