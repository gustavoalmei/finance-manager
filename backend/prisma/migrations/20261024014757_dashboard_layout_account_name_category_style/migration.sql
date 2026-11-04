-- AlterTable: contas existentes usavam `type` como nome
ALTER TABLE "Account" ADD COLUMN     "name" TEXT;
UPDATE "Account" SET "name" = "type";
ALTER TABLE "Account" ALTER COLUMN "name" SET NOT NULL;

-- AlterTable
ALTER TABLE "Category" ADD COLUMN     "color" TEXT NOT NULL DEFAULT 'blue',
ADD COLUMN     "icon" TEXT NOT NULL DEFAULT 'tag';

-- Categorias existentes: cores em rodízio por usuário (mesma ordem da paleta do front),
-- para não ficarem todas iguais nos gráficos
UPDATE "Category" AS c
SET "color" = (ARRAY['blue','orange','aqua','yellow','magenta','green','violet','red'])[((ranked.position - 1) % 8) + 1]
FROM (
  SELECT "id", ROW_NUMBER() OVER (PARTITION BY "userId" ORDER BY "createdAt") AS position
  FROM "Category"
) AS ranked
WHERE c."id" = ranked."id";

-- CreateTable
CREATE TABLE "DashboardLayout" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "widgets" JSONB NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DashboardLayout_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DashboardLayout_userId_key" ON "DashboardLayout"("userId");

-- CreateIndex
CREATE INDEX "Transaction_userId_date_idx" ON "Transaction"("userId", "date");

-- AddForeignKey
ALTER TABLE "DashboardLayout" ADD CONSTRAINT "DashboardLayout_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
