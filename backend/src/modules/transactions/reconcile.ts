// Conciliação: cada valor devolvido pela IA precisa existir no texto do
// usuário, e cada valor do texto precisa virar uma transação. É aritmética
// no código, não opinião de modelo: nada entra sem origem no texto.

// "1.234,56", "29,95", "-50,00", "R$ 50" ou inteiro no fim da linha ("Loja 120").
// Datas (2026-10-26, 08/10), parcelas (1/3) e números no meio do nome ficam de fora.
const MONEY = /(R\$\s*)?(?<![\d/.,])-?(\d{1,3}(?:\.\d{3})+|\d+)(?:,(\d{1,2}))?(?![\d/])/g;

const toCents = (integer: string, decimals: string | undefined) =>
  Number(integer.replace(/\./g, "")) * 100 +
  (decimals ? Number(decimals.padEnd(2, "0")) : 0);

// Valores (centavos) de uma linha do texto
export const lineAmounts = (line: string): number[] => {
  // tabela copiada (fatura/extrato, colunas com TAB): o valor é só a última
  // coluna; vazia = linha sem valor (o "37" de "Loja 37" não é valor)
  const text = line.includes("\t") ? (line.split("\t").at(-1) ?? "") : line;

  const amounts: number[] = [];
  for (const match of text.matchAll(MONEY)) {
    const [whole, currency, integer, decimals] = match;
    const atLineEnd = text.slice((match.index ?? 0) + whole.length).trim() === "";
    if (decimals !== undefined || currency || atLineEnd) {
      amounts.push(toCents(integer!, decimals));
    }
  }
  return amounts;
};

export type ReconcileEntry = {
  // linha de origem informada pela IA (1 = primeira); 0 = desconhecida
  line: number;
  amount: number; // centavos
  installmentCurrent: number;
  installmentTotal: number;
};

export type OmittedValue = { line: number; text: string; amount: number };

export type Reconciliation = {
  sourceTotal: number; // soma dos valores do texto (centavos)
  extractedTotal: number; // soma das transações devolvidas (centavos)
  // índices (em entries) cujo valor não existe no texto
  unmatched: number[];
  // valores do texto que não viraram transação
  omitted: OmittedValue[];
};

export const reconcile = (
  lines: string[],
  entries: ReconcileEntry[],
): Reconciliation => {
  // cada valor do texto é uma "ficha" que só pode ser usada uma vez
  // (R$ 7,40 que aparece 4 vezes vale para 4 transações, não 5)
  const pool = lines.flatMap((text, index) =>
    lineAmounts(text).map((amount) => ({ line: index + 1, amount, used: false })),
  );

  const unmatched: number[] = [];
  // soma no mesmo "idioma" do texto: compra nova parcelada conta a parcela
  // que está no texto, não o total que a IA calculou
  let extractedTotal = 0;
  entries.forEach((entry, index) => {
    // valor 0 = a IA não leu o valor: já sai com aviso próprio
    if (entry.amount <= 0) return;

    // compra nova parcelada ("3x de 100"): a IA devolve o total
    const isNewInstallment =
      entry.installmentTotal > 1 && entry.installmentCurrent === 1;
    const fits = (amount: number) =>
      amount === entry.amount ||
      (isNewInstallment && amount * entry.installmentTotal === entry.amount);

    const free = pool.filter((item) => !item.used && fits(item.amount));
    // a linha indicada pela IA tem preferência; se ela errou só a numeração,
    // o mesmo valor em outra linha ainda é origem válida
    const match = free.find((item) => item.line === entry.line) ?? free[0];

    if (match) match.used = true;
    else unmatched.push(index);
    extractedTotal += match ? match.amount : entry.amount;
  });

  return {
    sourceTotal: pool.reduce((total, item) => total + item.amount, 0),
    extractedTotal,
    unmatched,
    omitted: pool
      .filter((item) => !item.used)
      .map((item) => ({
        line: item.line,
        text: lines[item.line - 1]!.replace(/\t+/g, " ").trim(),
        amount: item.amount,
      })),
  };
};
