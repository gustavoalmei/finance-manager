import api from '../api'
import type { CardBrand } from '../creditCard'
import type { CategoryColor } from '../categories'
import { currentMonthRange, periodToISO } from '../transactions'
import type {
  Period,
  TransactionStatus,
  TransactionType,
} from '../transactions'

// ---------- período (search params da rota /) ----------

export const periodPresetLabels = {
  month: 'Mês atual',
  '3m': 'Últimos 3 meses',
  year: 'Ano atual',
  custom: 'Personalizado',
} as const

export type PeriodPreset = keyof typeof periodPresetLabels

export type DashboardSearch = {
  period?: PeriodPreset
  // só no personalizado: dias locais "aaaa-mm-dd"
  from?: string
  to?: string
}

const DAY_PATTERN = /^\d{4}-\d{2}-\d{2}$/

const parseDay = (value: unknown) => {
  if (typeof value !== 'string' || !DAY_PATTERN.test(value)) return undefined
  const [year, month, day] = value.split('-').map(Number) as [
    number,
    number,
    number,
  ]
  const date = new Date(year, month - 1, day)
  // recusa datas que "transbordam" (ex.: 2026-02-31)
  return date.getDate() === day ? date : undefined
}

export const formatDay = (date: Date) =>
  [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-')

// URL inválida ou incompleta cai no mês atual em vez de quebrar a tela
export const validateDashboardSearch = (
  search: Record<string, unknown>,
): DashboardSearch => {
  const period = search.period
  if (period === 'custom') {
    const from = parseDay(search.from)
    const to = parseDay(search.to)
    if (from && to && from <= to) {
      return { period, from: formatDay(from), to: formatDay(to) }
    }
    return {}
  }
  if (period === '3m' || period === 'year') return { period }
  return {}
}

// Os presets seguem o mês financeiro do usuário (startDay 1 = mês do calendário)
export const resolvePeriod = (
  { period, from, to }: DashboardSearch,
  startDay = 1,
): Period => {
  const current = currentMonthRange(startDay)
  // ano e mês do ciclo atual (dia 3 com início no dia 5 ainda é o ciclo do mês anterior)
  const year = current.from.getFullYear()
  const month = current.from.getMonth()

  switch (period) {
    case '3m':
      // ciclo atual + os 2 anteriores, inteiros
      return { from: new Date(year, month - 2, startDay), to: current.to }
    case 'year':
      // 12 ciclos: com início no dia 5, de 05/01 a 04/01 do ano seguinte
      return {
        from: new Date(year, 0, startDay),
        to: new Date(year + 1, 0, startDay - 1),
      }
    case 'custom':
      // validateDashboardSearch garante as duas datas
      return { from: parseDay(from)!, to: parseDay(to)! }
    default:
      return current
  }
}

// ---------- resumo ----------

// conta/cartão selecionado no header; vazio = todas as contas
export type DashboardScope = { accountId?: string; cardId?: string }

// tipo do escopo: decide quais widgets fazem sentido na tela
export type ScopeKind = 'all' | 'account' | 'card'

export const scopeKindOf = (scope: DashboardScope): ScopeKind =>
  scope.cardId ? 'card' : scope.accountId ? 'account' : 'all'

type Totals = {
  income: number
  expense: number
  result: number
}

type InvoiceAmount = {
  amount: number
  closingDate: string
  dueDate: string
}

export type DashboardTransaction = {
  id: string
  description: string
  type: TransactionType
  status: TransactionStatus
  amount: number
  date: string
  installmentNumber: number | null
  totalInstallments: number | null
  category: { name: string; color: CategoryColor; icon: string }
  // "Cartão X" ou o nome da conta
  source: string
}

// valores em centavos
export type DashboardSummary = {
  period: {
    start: string
    end: string
    granularity: 'day' | 'month'
    // dia de início do mês financeiro (agrupa a evolução mensal)
    monthStartDay: number
  }
  previousPeriod: { start: string; end: string }
  totals: Totals & { pendingIncome: number; pendingExpense: number }
  previousTotals: Totals
  // só no escopo de conta: mudam o saldo, mas não são receita nem despesa
  transfers: { incoming: number; outgoing: number } | null
  // bucket: "aaaa-mm-dd" (dia) ou "aaaa-mm" (mês)
  evolution: Array<{ bucket: string; income: number; expense: number }>
  expensesByCategory: Array<{
    categoryId: string
    name: string
    color: CategoryColor
    icon: string
    amount: number
    // mesma categoria no período anterior (0 = não teve gasto)
    previousAmount: number
  }>
  spendingByCard: Array<{
    cardId: string
    name: string
    brand: CardBrand
    amount: number
  }>
  balance: {
    total: number
    accounts: Array<{ id: string; name: string; type: string; balance: number }>
  }
  invoices: Array<{
    cardId: string
    name: string
    brand: CardBrand
    lastFourDigits: string | null
    dueDay: number
    creditLimit: number
    usedCredit: number
    current: InvoiceAmount
    upcoming: Array<InvoiceAmount>
  }>
  // as mais recentes do período (sem as futuras)
  recentTransactions: Array<DashboardTransaction>
  // pendentes fora do cartão, da mais antiga para a mais distante
  pendingBills: Array<DashboardTransaction>
  onboarding: {
    hasAccount: boolean
    hasCategory: boolean
    hasCard: boolean
    hasTransaction: boolean
  }
}

// ---------- layout ----------

export type WidgetType =
  | 'balance-total'
  | 'income'
  | 'expense'
  | 'result'
  | 'invoices'
  | 'evolution'
  | 'expenses-by-category'
  | 'spending-by-card'
  | 'balance-by-account'
  | 'card-limit'
  | 'category-ranking'
  | 'recent-transactions'
  | 'upcoming-bills'
  | 'carousel'

export type WidgetSize = 'sm' | 'md' | 'lg'

export type ChartKind = 'bar' | 'line' | 'pie'

// widgets que podem virar slide (mesma lista do back: dashboard/schema.ts)
export type SlideType = Extract<
  WidgetType,
  | 'evolution'
  | 'expenses-by-category'
  | 'spending-by-card'
  | 'invoices'
  | 'balance-by-account'
  | 'card-limit'
  | 'category-ranking'
  | 'recent-transactions'
  | 'upcoming-bills'
>

export type Slide = { type: SlideType; chart?: ChartKind }

export type Widget = {
  id: string
  type: WidgetType
  size: WidgetSize
  chart?: ChartKind
  slides?: Array<Slide>
}

export const dashboard = {
  summary: async (
    period: Period,
    scope: DashboardScope,
  ): Promise<DashboardSummary> => {
    const [from, to] = periodToISO(period)
    const { data } = await api.get('/dashboard', {
      params: { from, to, ...scope },
    })
    return data
  },
  // widgets null: usuário nunca salvou, o front usa o layout padrão
  getLayout: async (): Promise<{ widgets: Array<Widget> | null }> => {
    const { data } = await api.get('/dashboard/layout')
    return data
  },
  saveLayout: async (widgets: Array<Widget>) => {
    const { data } = await api.put('/dashboard/layout', { widgets })
    return data
  },
}
