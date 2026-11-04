import { prisma } from "@/app/plugins/database";

const startedAt = Date.now();

async function handlerHealth() {
  const checks: Record<string, "ok" | "down"> = {
    database: "ok",
  };

  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch {
    checks.database = "down";
  }

  const isHealthy = Object.values(checks).every((status) => status === "ok");

  return {
    status: isHealthy ? "ok" : "degraded",
    uptime: Math.floor((Date.now() - startedAt) / 1000),
    timestamp: new Date().toISOString(),
    checks,
  };
}

export default handlerHealth;
