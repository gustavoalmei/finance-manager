import type { FastifyInstance } from "fastify";
import handlerHealth from "@/modules/health/route";
import routerAuth from "@/modules/auth/routes";
import routerMe from "@/modules/me/routes";
import routerAccount from "@/modules/account/routes";
import routerCategory from "@/modules/category/routes";
import routerTransactions from "@/modules/transactions/routes";
import routerCard from "@/modules/card/routes";
import routerDashboard from "@/modules/dashboard/routes";

export default async function routes(fastify: FastifyInstance) {
  fastify.register(handlerHealth);
  fastify.register(routerMe);
  fastify.register(routerAuth, { prefix: "/auth" });
  fastify.register(routerAccount);
  fastify.register(routerCategory);
  fastify.register(routerTransactions);
  fastify.register(routerCard);
  fastify.register(routerDashboard);
}
