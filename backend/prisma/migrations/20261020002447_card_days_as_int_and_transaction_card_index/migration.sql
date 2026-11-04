-- closingDay/dueDay: DateTime -> Int (dia do mês).
-- Converte os dados existentes em vez de apagar e recriar a coluna.
-- Coluna é timestamp SEM fuso (o Prisma grava em UTC): EXTRACT direto lê o dia gravado.
-- (AT TIME ZONE converteria para timestamptz e o dia passaria a depender do fuso da sessão)
ALTER TABLE "Card"
  ALTER COLUMN "closingDay" TYPE INTEGER USING EXTRACT(DAY FROM "closingDay")::INTEGER,
  ALTER COLUMN "dueDay" TYPE INTEGER USING EXTRACT(DAY FROM "dueDay")::INTEGER;

-- O banco também garante o intervalo válido
ALTER TABLE "Card"
  ADD CONSTRAINT "Card_closingDay_check" CHECK ("closingDay" BETWEEN 1 AND 31),
  ADD CONSTRAINT "Card_dueDay_check" CHECK ("dueDay" BETWEEN 1 AND 31);

-- Soma por cartão e período (limite usado e fatura atual)
CREATE INDEX "Transaction_cardId_date_idx" ON "Transaction"("cardId", "date");
