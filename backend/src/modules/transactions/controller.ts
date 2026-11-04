import { handleError } from "@/shared/erros/handle-error";
import { HttpError } from "@/shared/erros/http-error";
import type { FastifyReply, FastifyRequest } from "fastify";
import { transactionService } from "./service";
import { transactionBodySchema } from "./schema";

interface transactionInterface {
  createTransaction: (
    request: FastifyRequest<createTransactionType>,
    reply: FastifyReply,
  ) => Promise<any>;
  putTransaction: (
    request: FastifyRequest<updateTransactionType>,
    reply: FastifyReply,
  ) => Promise<any>;
  deleteTransaction: (
    request: FastifyRequest<deleteTransactionType>,
    reply: FastifyReply,
  ) => Promise<any>;
  getTransactionById: (
    request: FastifyRequest<getByIdTransactionType>,
    reply: FastifyReply,
  ) => Promise<any>;
  getAllTransactions: (
    request: FastifyRequest<getAllTransactionsType>,
    reply: FastifyReply,
  ) => Promise<any>;
  transferTransaction: (
    request: FastifyRequest<transferTransactionType>,
    reply: FastifyReply,
  ) => Promise<any>;
  importFileTransactions: (
    request: FastifyRequest<importFileTransactionsType>,
    reply: FastifyReply,
  ) => Promise<any>;
  aiModels: (request: FastifyRequest, reply: FastifyReply) => Promise<any>;
  aiExtract: (
    request: FastifyRequest<aiExtractType>,
    reply: FastifyReply,
  ) => Promise<any>;
  importRows: (
    request: FastifyRequest<importRowsType>,
    reply: FastifyReply,
  ) => Promise<any>;
}

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

type userType = {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  updatedAt: string;
};

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

type getAllTransactionsType = {
  Querystring: {
    period?: string | string[];
    status?: "PENDING" | "CONFIRMED" | "CANCELLED";
    categoryId?: string;
    type?: "INCOME" | "EXPENSE" | "TRANSFER";
    isRecurring?: true | false;
    accountId?: string;
    cardId?: string;
  };
};

type importFileTransactionsType = {
  Body: {
    accountId?: string;
    file: string;
    name: string;
  };
};

export const controllerTransaction: transactionInterface = {
  createTransaction: async (
    request: FastifyRequest<createTransactionType>,
    reply: FastifyReply,
  ) => {
    try {
      let user = request.user as userType;

      let objectTransaction: any = {
        userId: user.id,
        categoryId: request.body.categoryId,
        type: request.body.type,
        status: request.body.status,
        amount: request.body.amount,
        description: request.body.description,
        date: request.body.date,
        isRecurring: request.body.isRecurring,
      };

      if (request.body.accountId) {
        objectTransaction.accountId = request.body.accountId;
      }
      if (request.body.cardId) {
        objectTransaction.cardId = request.body.cardId;
      }
      if (request.body.parentTransactionId) {
        objectTransaction.parentTransactionId =
          request.body.parentTransactionId;
      }
      if (request.body.installmentNumber) {
        objectTransaction.installmentNumber = request.body.installmentNumber;
      }
      if (request.body.totalInstallments) {
        objectTransaction.totalInstallments = request.body.totalInstallments;
      }

      if (!user) {
        return new HttpError(401, "Não autenticado.");
      }

      let parsedBody =
        transactionBodySchema.create.safeParse(objectTransaction);

      if (!parsedBody.success) {
        return new HttpError(
          400,
          parsedBody.error.issues[0]?.message ?? "Dados inválidos",
        );
      }

      let req = await transactionService.create(objectTransaction);

      return reply.code(201).send(req);
    } catch (error) {
      return handleError(reply, error);
    }
  },
  putTransaction: async (
    request: FastifyRequest<updateTransactionType>,
    reply: FastifyReply,
  ) => {
    try {
      let user = request.user as userType;

      if (!user) {
        return new HttpError(401, "Não autenticado.");
      }

      if (!request.params.id) {
        return new HttpError(400, "ID inválido.");
      }

      let objectUpdateTransaction: any = {
        id: request.params.id,
        userId: user.id,
        categoryId: request.body.categoryId,
        type: request.body.type,
        status: request.body.status,
        amount: request.body.amount,
        description: request.body.description,
        date: request.body.date,
        isRecurring: request.body.isRecurring,
      };

      if (request.body.accountId) {
        objectUpdateTransaction.accountId = request.body.accountId;
      }
      if (request.body.installmentNumber) {
        objectUpdateTransaction.installmentNumber =
          request.body.installmentNumber;
      }
      if (request.body.totalInstallments) {
        objectUpdateTransaction.totalInstallments =
          request.body.totalInstallments;
      }

      let parsedBody = transactionBodySchema.update.safeParse(
        objectUpdateTransaction,
      );

      if (!parsedBody.success) {
        return new HttpError(
          400,
          parsedBody.error.issues[0]?.message ?? "Dados inválidos",
        );
      }

      let req = await transactionService.update(objectUpdateTransaction);

      return reply.code(200).send(req);
    } catch (error) {
      return handleError(reply, error);
    }
  },
  deleteTransaction: async (
    request: FastifyRequest<deleteTransactionType>,
    reply: FastifyReply,
  ) => {
    try {
      let user = request.user as userType;

      let objectTransaction: any = {
        userId: user.id,
        id: request.params.id,
      };

      if (!user) {
        return new HttpError(401, "Não autenticado.");
      }

      let parsedBody =
        transactionBodySchema.delete.safeParse(objectTransaction);

      if (!parsedBody.success) {
        return new HttpError(
          400,
          parsedBody.error.issues[0]?.message ?? "Dados inválidos",
        );
      }

      let req = await transactionService.delete(objectTransaction);

      return reply.code(200).send(req);
    } catch (error) {
      return handleError(reply, error);
    }
  },
  getTransactionById: async (
    request: FastifyRequest<getByIdTransactionType>,
    reply: FastifyReply,
  ) => {
    try {
      let user = request.user as userType;

      if (!user) {
        return new HttpError(401, "Não autenticado.");
      }

      if (!request.params.id) {
        return new HttpError(400, "ID inválido.");
      }

      let parsedBody = transactionBodySchema.getById.safeParse({
        id: request.params.id,
        userId: user.id,
      });

      if (!parsedBody.success) {
        return new HttpError(
          400,
          parsedBody.error.issues[0]?.message ?? "Dados inválidos",
        );
      }

      let req = await transactionService.getById({
        id: parsedBody.data.id,
        userId: parsedBody.data.userId,
      });

      return reply.code(200).send(req);
    } catch (error) {
      return handleError(reply, error);
    }
  },
  getAllTransactions: async (
    request: FastifyRequest<getAllTransactionsType>,
    reply: FastifyReply,
  ) => {
    try {
      let user = request.user as userType;

      if (!user) {
        return new HttpError(401, "Não autenticado.");
      }

      let parsedBody = transactionBodySchema.getAll.safeParse({
        ...request.query,
        userId: user.id,
      });

      if (!parsedBody.success) {
        return new HttpError(
          400,
          parsedBody.error.issues[0]?.message ?? "Dados inválidos",
        );
      }

      let req = await transactionService.getAllTransactions(parsedBody.data);

      return reply.code(200).send(req);
    } catch (error) {
      return handleError(reply, error);
    }
  },
  transferTransaction: async (
    request: FastifyRequest<transferTransactionType>,
    reply: FastifyReply,
  ) => {
    try {
      let user = request.user as userType;

      if (!user) {
        return new HttpError(401, "Não autenticado.");
      }

      let parsedBody = transactionBodySchema.transfer.safeParse(request.body);

      if (!parsedBody.success) {
        return new HttpError(
          400,
          parsedBody.error.issues[0]?.message ?? "Dados inválidos",
        );
      }

      let req = await transactionService.transfer({
        ...request.body,
        userId: user.id,
      });

      return reply.code(200).send(req);
    } catch (error) {
      return handleError(reply, error);
    }
  },
  importFileTransactions: async (
    request: FastifyRequest<importFileTransactionsType>,
    reply: FastifyReply,
  ) => {
    try {
      let user = request.user as userType;

      if (!user) {
        return new HttpError(401, "Não autenticado.");
      }

      let parsedBody = transactionBodySchema.importFile.safeParse(request.body);

      if (!parsedBody.success) {
        return new HttpError(
          400,
          parsedBody.error.issues[0]?.message ?? "Dados inválidos",
        );
      }

      let req = await transactionService.importFile({
        ...request.body,
        userId: user.id,
      });

      return reply.code(200).send(req);
    } catch (error) {
      return handleError(reply, error);
    }
  },
  aiModels: async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      let user = request.user as userType;

      if (!user) {
        throw new HttpError(401, "Não autenticado.");
      }

      let models = await transactionService.aiModels();

      return reply.code(200).send(models);
    } catch (error) {
      return handleError(reply, error);
    }
  },
  aiExtract: async (
    request: FastifyRequest<aiExtractType>,
    reply: FastifyReply,
  ) => {
    try {
      let user = request.user as userType;

      if (!user) {
        throw new HttpError(401, "Não autenticado.");
      }

      let parsedBody = transactionBodySchema.aiExtract.safeParse(request.body);

      if (!parsedBody.success) {
        throw new HttpError(
          400,
          parsedBody.error.issues[0]?.message ?? "Dados inválidos",
        );
      }

      let req = await transactionService.aiExtract({
        userId: user.id,
        text: parsedBody.data.text,
        model: parsedBody.data.model,
        source: parsedBody.data.source,
        cardId: parsedBody.data.cardId,
      });

      return reply.code(200).send(req);
    } catch (error) {
      return handleError(reply, error);
    }
  },
  importRows: async (
    request: FastifyRequest<importRowsType>,
    reply: FastifyReply,
  ) => {
    try {
      let user = request.user as userType;

      if (!user) {
        throw new HttpError(401, "Não autenticado.");
      }

      let parsedBody = transactionBodySchema.importRows.safeParse(request.body);

      if (!parsedBody.success) {
        const issue = parsedBody.error.issues[0];
        // rows.3.categoryId → "Linha 4: ..."
        const row = issue?.path[0] === "rows" ? issue.path[1] : undefined;
        throw new HttpError(
          400,
          `${typeof row === "number" ? `Linha ${row + 1}: ` : ""}${issue?.message ?? "Dados inválidos"}`,
        );
      }

      let req = await transactionService.importRows({
        userId: user.id,
        accountId: parsedBody.data.accountId,
        rows: parsedBody.data.rows,
      });

      return reply.code(201).send(req);
    } catch (error) {
      return handleError(reply, error);
    }
  },
};
