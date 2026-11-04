import type { Prisma } from "@/generated/prisma/client";

type BalanceSource = {
  type: string;
  status: string;
  amount: number;
  accountId: string;
  cardId?: string | null | undefined;
  sourceAccountId?: string | null | undefined;
  destinationAccountId?: string | null | undefined;
  deletedAt?: Date | null | undefined;
};

export type BalanceChange = { accountId: string; delta: number };

// Quanto cada conta muda por causa de um lançamento.
// Só confirmados mexem no saldo. Compra no cartão não sai da conta: o dinheiro
// sai quando a fatura é paga (TRANSFER com cardId e sem conta de destino).
export const balanceChanges = (transaction: BalanceSource): BalanceChange[] => {
  if (transaction.status !== "CONFIRMED" || transaction.deletedAt) return [];

  switch (transaction.type) {
    case "INCOME":
      return [{ accountId: transaction.accountId, delta: transaction.amount }];
    case "EXPENSE":
      return transaction.cardId
        ? []
        : [{ accountId: transaction.accountId, delta: -transaction.amount }];
    case "TRANSFER":
      return [
        {
          accountId: transaction.sourceAccountId ?? transaction.accountId,
          delta: -transaction.amount,
        },
        ...(transaction.destinationAccountId
          ? [
              {
                accountId: transaction.destinationAccountId,
                delta: transaction.amount,
              },
            ]
          : []),
      ];
    default:
      return [];
  }
};

export const revertChanges = (changes: BalanceChange[]) =>
  changes.map((change) => ({ ...change, delta: -change.delta }));

// Roda dentro do mesmo $transaction da escrita do lançamento: ou os dois
// gravam, ou nenhum. increment vira "SET saldo = saldo + x" no SQL, sem ler
// antes, então duas requisições ao mesmo tempo não se sobrescrevem.
export const applyBalanceChanges = async (
  tx: Prisma.TransactionClient,
  changes: BalanceChange[],
) => {
  const deltaByAccount = new Map<string, number>();
  for (const change of changes) {
    deltaByAccount.set(
      change.accountId,
      (deltaByAccount.get(change.accountId) ?? 0) + change.delta,
    );
  }

  for (const [id, delta] of deltaByAccount) {
    if (delta === 0) continue;
    await tx.account.update({
      where: { id },
      data: { accountBalance: { increment: delta } },
    });
  }
};
