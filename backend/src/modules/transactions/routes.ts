import type { FastifyInstance } from "fastify";
import { controllerTransaction } from "./controller";

type createTransactionType = {
  Body: {
    accountId?: string;
    categoryId: string;
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
};

type updateTransactionType = {
  Params: {
    id: string;
  };
  Body: {
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
  Params: {
    id: string;
  };
};

type getByIdTransactionType = {
  Params: {
    id: string;
  };
};

type getAllTransactionsType = {
  Querystring: {
    period?: string;
    status?: "PENDING" | "CONFIRMED" | "CANCELLED";
    categoryId?: string;
    type?: "INCOME" | "EXPENSE" | "TRANSFER";
    isRecurring?: true | false;
    accountId?: string;
    cardId?: string;
  };
};

type transferTransactionType = {
  Body: {
    sourceAccount: string;
    destinationAccount: string;
    amount: number;
    date: Date;
    categoryId: string;
    description?: string;
    isRecurring: true | false;
  };
};

type importFileTransactionType = {
  Body: {
    accountId?: string;
    file: string;
    name: string;
  };
};
type aiExtractType = {
  Body: {
    text: string;
    model?: string;
    source?: "auto" | "account" | "card";
    cardId?: string;
  };
};

type importRowsType = {
  Body: {
    accountId?: string;
    rows: unknown[];
  };
};

export default async function routes(fastify: FastifyInstance) {
  fastify.post<createTransactionType>(
    "/transactions/create",
    { preHandler: fastify.authenticate },
    controllerTransaction.createTransaction,
  );
  fastify.put<updateTransactionType>(
    "/transactions/:id",
    { preHandler: fastify.authenticate },
    controllerTransaction.putTransaction,
  );
  fastify.delete<deleteTransactionType>(
    "/transactions/:id",
    { preHandler: fastify.authenticate },
    controllerTransaction.deleteTransaction,
  );
  fastify.get<getByIdTransactionType>(
    "/transactions/:id",
    { preHandler: fastify.authenticate },
    controllerTransaction.getTransactionById,
  );
  fastify.get<getAllTransactionsType>(
    "/transactions/all",
    { preHandler: fastify.authenticate },
    controllerTransaction.getAllTransactions,
  );
  fastify.post<transferTransactionType>(
    "/transactions/transfer",
    { preHandler: fastify.authenticate },
    controllerTransaction.transferTransaction,
  );
  fastify.post<importFileTransactionType>(
    "/transactions/import",
    { preHandler: fastify.authenticate },
    controllerTransaction.importFileTransactions,
  );
  fastify.get(
    "/transactions/ai/models",
    { preHandler: fastify.authenticate },
    controllerTransaction.aiModels,
  );
  fastify.post<aiExtractType>(
    "/transactions/ai/extract",
    {
      preHandler: fastify.authenticate,
      // 20/min por IP: evita queimar a cota do OpenRouter com chamadas em massa
      config: { rateLimit: { max: 20, timeWindow: "1 minute" } },
    },
    controllerTransaction.aiExtract,
  );
  fastify.post<importRowsType>(
    "/transactions/import-rows",
    { preHandler: fastify.authenticate },
    controllerTransaction.importRows,
  );
}
