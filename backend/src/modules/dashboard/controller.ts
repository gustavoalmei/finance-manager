import type { FastifyReply, FastifyRequest } from "fastify";
import { handleError } from "@/shared/erros/handle-error";
import { HttpError } from "@/shared/erros/http-error";
import { dashboardSchema } from "./schema";
import { dashboardService } from "./service";

type userType = {
  id: string;
  name: string;
  email: string;
};

type summaryType = {
  Querystring: {
    from: string;
    to: string;
    accountId?: string;
    cardId?: string;
  };
};

type saveLayoutType = {
  Body: {
    widgets: unknown[];
  };
};

interface dashboardControllerInterface {
  summary: (
    request: FastifyRequest<summaryType>,
    reply: FastifyReply,
  ) => Promise<any>;
  getLayout: (request: FastifyRequest, reply: FastifyReply) => Promise<any>;
  saveLayout: (
    request: FastifyRequest<saveLayoutType>,
    reply: FastifyReply,
  ) => Promise<any>;
}

export const dashboardController: dashboardControllerInterface = {
  summary: async (
    request: FastifyRequest<summaryType>,
    reply: FastifyReply,
  ) => {
    try {
      let user = request.user as userType;

      if (!user) {
        throw new HttpError(401, "Não autenticado.");
      }

      let parsedQuery = dashboardSchema.summary.safeParse(request.query);

      if (!parsedQuery.success) {
        throw new HttpError(
          400,
          parsedQuery.error.issues[0]?.message ?? "Dados inválidos.",
        );
      }

      let summary = await dashboardService.summary({
        userId: user.id,
        ...parsedQuery.data,
      });

      return reply.code(200).send(summary);
    } catch (error) {
      return handleError(reply, error);
    }
  },
  getLayout: async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      let user = request.user as userType;

      if (!user) {
        throw new HttpError(401, "Não autenticado.");
      }

      let layout = await dashboardService.getLayout(user.id);

      return reply.code(200).send(layout);
    } catch (error) {
      return handleError(reply, error);
    }
  },
  saveLayout: async (
    request: FastifyRequest<saveLayoutType>,
    reply: FastifyReply,
  ) => {
    try {
      let user = request.user as userType;

      if (!user) {
        throw new HttpError(401, "Não autenticado.");
      }

      let parsedBody = dashboardSchema.layout.safeParse(request.body);

      if (!parsedBody.success) {
        throw new HttpError(
          400,
          parsedBody.error.issues[0]?.message ?? "Dados inválidos.",
        );
      }

      let layout = await dashboardService.saveLayout({
        userId: user.id,
        widgets: parsedBody.data.widgets,
      });

      return reply.code(200).send(layout);
    } catch (error) {
      return handleError(reply, error);
    }
  },
};
