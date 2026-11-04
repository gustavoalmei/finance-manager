import type { FastifyInstance } from "fastify";
import { dashboardController } from "./controller";

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

export default async function routes(fastify: FastifyInstance) {
  fastify.get<summaryType>(
    "/dashboard",
    { preHandler: fastify.authenticate },
    dashboardController.summary,
  );
  fastify.get(
    "/dashboard/layout",
    { preHandler: fastify.authenticate },
    dashboardController.getLayout,
  );
  fastify.put<saveLayoutType>(
    "/dashboard/layout",
    { preHandler: fastify.authenticate },
    dashboardController.saveLayout,
  );
}
