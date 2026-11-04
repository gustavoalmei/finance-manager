import { cardRepository } from "./repository";
import { HttpError } from "@/shared/erros/http-error";
import { authRepository } from "../auth/repository";
import { accountRepository } from "../account/repository";
import { transactionRepository } from "../transactions/repository";
import { getBillingCycle } from "@/shared/utils/date";
import type { CardSumRow } from "./repository";
import type { CardBody } from "./schema";

interface cardService {
  create: (data: createType) => Promise<any>;
  findAll: (data: findAllType) => Promise<any>;
  findByID: (data: findByIDType) => Promise<any>;
  update: (data: updateType) => Promise<any>;
  delete: (data: deleteType) => Promise<any>;
}

type createType = CardBody & {
  userId: string;
  accountId: string;
};

type findAllType = {
  userId: string;
};

type findByIDType = {
  id: string;
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

// compras - pagamentos de fatura de um cartão, a partir do groupBy
const netSpent = (rows: CardSumRow[], cardId: string) =>
  rows
    .filter((row) => row.cardId === cardId)
    .reduce(
      (total, row) =>
        total + (row.type === "EXPENSE" ? 1 : -1) * (row._sum.amount ?? 0),
      0,
    );

const expensesOf = (rows: CardSumRow[], cardId: string) =>
  rows.find((row) => row.cardId === cardId && row.type === "EXPENSE")?._sum
    .amount ?? 0;

export const cardService: cardService = {
  create: async (data: createType) => {
    try {
      // Procura se o usuario existe
      let findUser = await authRepository.findById({ id: data.userId });
      if (!findUser) {
        throw new HttpError(404, "Usuário não encontrado.");
      }

      let findAccount = await accountRepository.findById({
        id: data.accountId,
        userId: data.userId,
      });
      if (!findAccount) {
        throw new HttpError(404, "Conta não encontrada.");
      }

      // Procura se o cartao existe
      let findCard = await cardRepository.findByName({
        name: findUser.name,
        userId: data.userId,
      });
      if (findCard) {
        throw new HttpError(400, "Cartão já cadastrado.");
      }

      // Cria o cartao
      let cardCreate = await cardRepository.create({
        ...data,
        userId: data.userId,
        accountId: findAccount.id,
      });

      return cardCreate;
    } catch (error: any) {
      throw new HttpError(
        error.statusCode || 500,
        error.message || "Erro ao criar o cartão.",
      );
    }
  },
  findAll: async (data: findAllType) => {
    try {
      // Procura se o usuario existe
      let findUser = await authRepository.findById({ id: data.userId });
      if (!findUser) {
        throw new HttpError(404, "Usuário não encontrado.");
      }

      const cards = await cardRepository.getAll({ userId: data.userId });
      if (cards.length === 0) return [];

      // limite usado: 1 consulta para todos os cartões.
      // fatura: 1 por cartão (cada um tem o próprio ciclo). Tudo em paralelo.
      const [totals, invoices] = await Promise.all([
        cardRepository.sumByCard({
          userId: data.userId,
          cardIds: cards.map((card) => card.id),
        }),
        Promise.all(
          cards.map(async (card) => {
            const cycle = getBillingCycle(card.closingDay, card.dueDay);
            const rows = await cardRepository.sumByCard({
              userId: data.userId,
              cardIds: [card.id],
              period: cycle,
            });
            return { card, cycle, invoiceAmount: expensesOf(rows, card.id) };
          }),
        ),
      ]);

      return invoices.map(({ card, cycle, invoiceAmount }) => {
        // pagamento maior que as compras não gera limite "extra"
        const usedCredit = Math.max(netSpent(totals, card.id), 0);

        return {
          ...card,
          usedCredit,
          availableCredit: card.creditLimit - usedCredit,
          currentInvoice: {
            amount: invoiceAmount,
            periodStart: cycle.start,
            closingDate: cycle.closingDate,
            dueDate: cycle.dueDate,
          },
        };
      });
    } catch (error: any) {
      throw new HttpError(
        error.statusCode || 500,
        error.message || "Erro ao buscar os cartões.",
      );
    }
  },
  findByID: async (data: findByIDType) => {
    try {
      // Procura se o usuario existe
      let findUser = await authRepository.findById({ id: data.userId });
      if (!findUser) {
        throw new HttpError(404, "Usuário não encontrado.");
      }

      // Procura o cartao
      let cardCreate = await cardRepository.findById({
        id: data.id,
        userId: data.userId,
      });

      if (!cardCreate) {
        throw new HttpError(404, "Cartão nao encontrado.");
      }
      return cardCreate;
    } catch (error: any) {
      throw new HttpError(
        error.statusCode || 500,
        error.message || "Erro ao buscar os cartões.",
      );
    }
  },
  update: async (data: updateType) => {
    try {
      // Procura se o usuario existe
      let findUser = await authRepository.findById({ id: data.userId });
      if (!findUser) {
        throw new HttpError(404, "Usuário não encontrado.");
      }

      // Procura se o cartao existe
      let findCard = await cardRepository.findById({
        id: data.id,
        userId: data.userId,
      });
      if (!findCard) {
        throw new HttpError(404, "Cartão não encontrado.");
      }

      // Cria o cartao
      await cardRepository.update({
        ...data,
        id: data.id,
        userId: data.userId,
      });

      return { message: "Cartão atualizado com sucesso." };
    } catch (error: any) {
      throw new HttpError(
        error.statusCode || 500,
        error.message || "Erro ao buscar os cartões.",
      );
    }
  },
  delete: async (data: deleteType) => {
    try {
      // Procura se o usuario existe
      let findUser = await authRepository.findById({ id: data.userId });
      if (!findUser) {
        throw new HttpError(404, "Usuário não encontrado.");
      }

      // Procura se o cartao existe
      let findCard = await cardRepository.findById({
        id: data.id,
        userId: data.userId,
      });
      if (!findCard) {
        throw new HttpError(404, "Cartão não encontrado.");
      }

      let cardContainsTransactions = await transactionRepository.findByCardId({
        id: data.id,
        userId: data.userId,
      });

      console.log(cardContainsTransactions.length);
      if (cardContainsTransactions.length > 0) {
        throw new HttpError(400, "Cartão possui transações.");
      }

      // Deleta o cartao
      await cardRepository.delete({ id: data.id, userId: data.userId });

      return { message: "Cartão deletado com sucesso." };
    } catch (error: any) {
      throw new HttpError(
        error.statusCode || 500,
        error.message || "Erro ao buscar os cartões.",
      );
    }
  },
};
