// Datas em UTC: o banco guarda em UTC e o dia não pode "escorregar" pelo fuso local.

const ONE_DAY_MS = 86_400_000;

const daysInMonthUTC = (year: number, month: number) =>
  new Date(Date.UTC(year, month + 1, 0)).getUTCDate();

// Dia `day` do mês, limitado ao último dia (ex.: 31 em fevereiro → 28/29)
export const clampedDateUTC = (year: number, month: number, day: number) =>
  new Date(Date.UTC(year, month, Math.min(day, daysInMonthUTC(year, month))));

// Soma meses mantendo o dia (31/01 + 1 mês → 28/02, não 03/03) e o horário
export const addMonthsUTC = (date: Date, months: number) => {
  const target = clampedDateUTC(
    date.getUTCFullYear(),
    date.getUTCMonth() + months,
    date.getUTCDate(),
  );
  target.setUTCHours(
    date.getUTCHours(),
    date.getUTCMinutes(),
    date.getUTCSeconds(),
    date.getUTCMilliseconds(),
  );
  return target;
};

export type BillingCycle = {
  // compras com data em [start, end) entram na fatura
  start: Date;
  end: Date;
  closingDate: Date;
  dueDate: Date;
};

// Fatura aberta em `reference`: vai do dia seguinte ao último fechamento até o
// próximo fechamento (inclusive). Vencimento no mesmo mês do fechamento se
// dueDay > closingDay; senão, no mês seguinte.
export const getBillingCycle = (
  closingDay: number,
  dueDay: number,
  reference = new Date(),
): BillingCycle => {
  const year = reference.getUTCFullYear();
  const month = reference.getUTCMonth();
  const today = Date.UTC(year, month, reference.getUTCDate());

  const closingThisMonth = clampedDateUTC(year, month, closingDay);
  const closingMonth =
    today <= closingThisMonth.getTime() ? month : month + 1;

  const closingDate = clampedDateUTC(year, closingMonth, closingDay);
  const previousClosing = clampedDateUTC(year, closingMonth - 1, closingDay);
  const dueMonth = dueDay > closingDay ? closingMonth : closingMonth + 1;

  return {
    start: new Date(previousClosing.getTime() + ONE_DAY_MS),
    end: new Date(closingDate.getTime() + ONE_DAY_MS),
    closingDate,
    dueDate: clampedDateUTC(year, dueMonth, dueDay),
  };
};

export type Period = { start: Date; end: Date };

// "2026-10-23" (dia) ou "2026-10" (mês) de uma data UTC
const dayKey = (date: Date) => date.toISOString().slice(0, 10);
const monthKey = (date: Date) => date.toISOString().slice(0, 7);

// `end` vem como 23:59:59.999 do último dia (mesmo formato do filtro de transações).
// Meses inteiros = começa à meia-noite do dia D e termina na véspera do dia D
// (1º → último dia no calendário; 5 → 4 no mês financeiro que começa no dia 5).
const isWholeMonths = ({ start, end }: Period) => {
  const next = new Date(end.getTime() + 1);
  return (
    start.getUTCHours() === 0 &&
    next.getUTCHours() === 0 &&
    start.getUTCDate() === next.getUTCDate()
  );
};

// Período de comparação: meses inteiros → os mesmos N meses logo antes
// (out → set; ano → ano anterior); senão, o mesmo número de dias logo antes.
export const getPreviousPeriod = (period: Period): Period => {
  const end = new Date(period.start.getTime() - 1);

  if (isWholeMonths(period)) {
    const next = new Date(period.end.getTime() + 1);
    const months =
      (next.getUTCFullYear() - period.start.getUTCFullYear()) * 12 +
      (next.getUTCMonth() - period.start.getUTCMonth());
    const start = new Date(
      Date.UTC(
        period.start.getUTCFullYear(),
        period.start.getUTCMonth() - months,
        period.start.getUTCDate(),
      ),
    );
    return { start, end };
  }

  return {
    start: new Date(end.getTime() - (period.end.getTime() - period.start.getTime())),
    end,
  };
};

export type Granularity = "day" | "month";

// até 31 dias: um ponto por dia; acima disso, por mês
export const getGranularity = ({ start, end }: Period): Granularity =>
  end.getTime() - start.getTime() < 31 * ONE_DAY_MS ? "day" : "month";

// Início do mês financeiro que contém `date` (startDay 1 = mês do calendário).
// startDay vai até 28, então todo mês tem esse dia.
const cycleStart = (date: Date, startDay: number) =>
  new Date(
    Date.UTC(
      date.getUTCFullYear(),
      date.getUTCMonth() - (date.getUTCDate() < startDay ? 1 : 0),
      startDay,
    ),
  );

// Mês financeiro é identificado pelo mês em que começa: 05/10–04/11 → "2026-10"
export const bucketKey = (date: Date, granularity: Granularity, startDay = 1) =>
  granularity === "day" ? dayKey(date) : monthKey(cycleStart(date, startDay));

// Todas as chaves do período, para o gráfico não pular dias/meses sem lançamento
export const getBuckets = (
  period: Period,
  granularity: Granularity,
  startDay = 1,
) => {
  const keys: string[] = [];
  let cursor =
    granularity === "day"
      ? new Date(
          Date.UTC(
            period.start.getUTCFullYear(),
            period.start.getUTCMonth(),
            period.start.getUTCDate(),
          ),
        )
      : cycleStart(period.start, startDay);
  while (cursor <= period.end) {
    keys.push(bucketKey(cursor, granularity, startDay));
    cursor =
      granularity === "day"
        ? new Date(cursor.getTime() + ONE_DAY_MS)
        : new Date(
            Date.UTC(cursor.getUTCFullYear(), cursor.getUTCMonth() + 1, startDay),
          );
  }
  return keys;
};
