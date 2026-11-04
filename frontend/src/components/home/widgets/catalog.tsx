import type { ReactNode } from 'react'
import {
  CalendarClock,
  ChartColumn,
  ChartPie,
  CreditCard,
  GalleryHorizontal,
  History,
  Landmark,
  Receipt,
  Scale,
  ShoppingBag,
  Trophy,
  TrendingDown,
  TrendingUp,
  Wallet,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type {
  ChartKind,
  DashboardSummary,
  ScopeKind,
  Slide,
  SlideType,
  Widget,
  WidgetSize,
  WidgetType,
} from '#/lib/dashboard'
import { CategoryWidget } from './category-widget'
import { EvolutionWidget } from './evolution-widget'
import {
  BalanceTotalWidget,
  ExpenseWidget,
  IncomeWidget,
  ResultWidget,
} from './kpi-widgets'
import { CardLimitWidget } from './card-limit-widget'
import {
  AccountsWidget,
  CardSpendingWidget,
  InvoicesWidget,
} from './list-widgets'
import { CategoryRankingWidget } from './ranking-widget'
import {
  PendingBillsWidget,
  RecentTransactionsWidget,
} from './transaction-widgets'
import { SlideCarousel } from './slide-carousel'

type RenderProps = {
  summary: DashboardSummary
  chart?: ChartKind
  slides?: Array<Slide>
  editing: boolean
  scope: ScopeKind
}

type WidgetDefinition = {
  title: string
  // ícone ao lado do título; pode mudar com o escopo (ex.: compras no cartão)
  icon: LucideIcon
  scopeIcons?: Partial<Record<ScopeKind, LucideIcon>>
  // texto do diálogo "Adicionar card"
  description: string
  sizes: Array<WidgetSize>
  // primeiro = padrão
  charts?: Array<ChartKind>
  // false: pode aparecer mais de uma vez
  unique: boolean
  // depende do filtro de período? (os outros são "agora")
  usesPeriod: boolean
  // escopos do header em que o widget faz sentido; fora deles fica oculto
  scopes: Array<ScopeKind>
  // título diferente em algum escopo (ex.: "Compras" no cartão)
  scopeTitles?: Partial<Record<ScopeKind, string>>
  render: (props: RenderProps) => ReactNode
}

const ALL_SCOPES: Array<ScopeKind> = ['all', 'account', 'card']

export const chartLabels: Record<ChartKind, string> = {
  bar: 'Barras',
  line: 'Linha',
  pie: 'Pizza',
}

export const sizeLabels: Record<WidgetSize, string> = {
  sm: 'P',
  md: 'M',
  lg: 'G',
}

// Novo tipo de card: adicionar aqui e em dashboard/schema.ts no back
export const widgetCatalog: Record<WidgetType, WidgetDefinition> = {
  'balance-total': {
    title: 'Saldo total',
    icon: Wallet,
    description: 'Soma do saldo atual de todas as contas.',
    sizes: ['sm', 'md'],
    unique: true,
    usesPeriod: false,
    scopes: ['all', 'account'],
    scopeTitles: { account: 'Saldo da conta' },
    render: ({ summary }) => <BalanceTotalWidget summary={summary} />,
  },
  income: {
    title: 'Receitas',
    icon: TrendingUp,
    description: 'Receitas confirmadas no período, com comparação.',
    sizes: ['sm', 'md'],
    unique: true,
    usesPeriod: true,
    scopes: ['all', 'account'],
    render: ({ summary }) => <IncomeWidget summary={summary} />,
  },
  expense: {
    title: 'Despesas',
    icon: TrendingDown,
    scopeIcons: { card: ShoppingBag },
    description: 'Despesas confirmadas no período, com comparação.',
    sizes: ['sm', 'md'],
    unique: true,
    usesPeriod: true,
    scopes: ALL_SCOPES,
    scopeTitles: { card: 'Compras' },
    render: ({ summary }) => <ExpenseWidget summary={summary} />,
  },
  result: {
    title: 'Resultado',
    icon: Scale,
    description: 'Receitas menos despesas no período.',
    sizes: ['sm', 'md'],
    unique: true,
    usesPeriod: true,
    scopes: ['all', 'account'],
    render: ({ summary }) => <ResultWidget summary={summary} />,
  },
  invoices: {
    title: 'Faturas',
    icon: Receipt,
    description: 'Fatura atual e as próximas de cada cartão.',
    sizes: ['md', 'lg'],
    unique: true,
    usesPeriod: false,
    scopes: ALL_SCOPES,
    render: ({ summary, scope }) => (
      <InvoicesWidget summary={summary} scope={scope} />
    ),
  },
  evolution: {
    title: 'Evolução',
    icon: ChartColumn,
    description: 'Receitas e despesas ao longo do período.',
    sizes: ['md', 'lg'],
    charts: ['bar', 'line'],
    unique: true,
    usesPeriod: true,
    scopes: ALL_SCOPES,
    render: ({ summary, chart, scope }) => (
      <EvolutionWidget summary={summary} chart={chart} scope={scope} />
    ),
  },
  'expenses-by-category': {
    title: 'Despesas por categoria',
    icon: ChartPie,
    description: 'As maiores categorias de gasto do período.',
    sizes: ['md', 'lg'],
    charts: ['pie', 'bar'],
    unique: true,
    usesPeriod: true,
    scopes: ALL_SCOPES,
    render: ({ summary, chart }) => (
      <CategoryWidget summary={summary} chart={chart} />
    ),
  },
  'spending-by-card': {
    title: 'Gastos por cartão',
    icon: CreditCard,
    description: 'Compras no período em cada cartão.',
    sizes: ['md', 'lg'],
    unique: true,
    usesPeriod: true,
    scopes: ['all', 'account'],
    render: ({ summary }) => <CardSpendingWidget summary={summary} />,
  },
  'balance-by-account': {
    title: 'Saldo por conta',
    icon: Landmark,
    description: 'Saldo atual de cada conta.',
    sizes: ['sm', 'md', 'lg'],
    unique: true,
    usesPeriod: false,
    scopes: ['all'],
    render: ({ summary }) => <AccountsWidget summary={summary} />,
  },
  'card-limit': {
    title: 'Limite do cartão',
    icon: CreditCard,
    description: 'Limite disponível e usado de cada cartão.',
    // o visual do cartão não cabe em 1 coluna
    sizes: ['md', 'lg'],
    unique: true,
    usesPeriod: false,
    scopes: ALL_SCOPES,
    render: ({ summary, scope }) => (
      <CardLimitWidget summary={summary} scope={scope} />
    ),
  },
  'category-ranking': {
    title: 'Ranking de categorias',
    icon: Trophy,
    description:
      'Categorias que mais gastaram, com a variação contra o período anterior.',
    sizes: ['md', 'lg'],
    unique: true,
    usesPeriod: true,
    scopes: ALL_SCOPES,
    render: ({ summary }) => <CategoryRankingWidget summary={summary} />,
  },
  'recent-transactions': {
    title: 'Últimas transações',
    icon: History,
    description: 'Os lançamentos mais recentes do período.',
    sizes: ['md', 'lg'],
    unique: true,
    usesPeriod: true,
    scopes: ALL_SCOPES,
    render: ({ summary }) => <RecentTransactionsWidget summary={summary} />,
  },
  'upcoming-bills': {
    title: 'Contas a pagar e receber',
    icon: CalendarClock,
    description:
      'Lançamentos pendentes por vencimento, com os atrasados no topo.',
    sizes: ['md', 'lg'],
    unique: true,
    usesPeriod: false,
    // compra no cartão é paga pela fatura (já em Faturas)
    scopes: ['all', 'account'],
    render: ({ summary }) => <PendingBillsWidget summary={summary} />,
  },
  carousel: {
    title: 'Carrossel',
    icon: GalleryHorizontal,
    description: 'Vários indicadores no mesmo card, um por slide.',
    sizes: ['md', 'lg'],
    unique: false,
    usesPeriod: true,
    scopes: ALL_SCOPES,
    render: ({ summary, slides = [], editing, scope }) => (
      <SlideCarousel
        swipeable={!editing}
        slides={slides
          // o índice vem antes do filtro: a key não muda quando o escopo esconde um slide
          .map((slide, index) => ({ slide, index }))
          .filter(({ slide }) =>
            widgetCatalog[slide.type].scopes.includes(scope),
          )
          .map(({ slide, index }) => ({
            // o mesmo tipo pode repetir com outro gráfico
            key: `${slide.type}-${index}`,
            title: getWidgetTitle(slide.type, scope),
            content: widgetCatalog[slide.type].render({
              summary,
              chart: slide.chart,
              editing,
              scope,
            }),
          }))}
      />
    ),
  },
}

export const slideTypes: Array<SlideType> = [
  'expenses-by-category',
  'evolution',
  'spending-by-card',
  'category-ranking',
  'recent-transactions',
  'upcoming-bills',
  'invoices',
  'card-limit',
  'balance-by-account',
]

export const getWidgetTitle = (type: WidgetType, scope: ScopeKind) =>
  widgetCatalog[type].scopeTitles?.[scope] ?? widgetCatalog[type].title

export const getWidgetIcon = (type: WidgetType, scope: ScopeKind) =>
  widgetCatalog[type].scopeIcons?.[scope] ?? widgetCatalog[type].icon

// carrossel aparece se ao menos um slide se aplica ao escopo
export const isWidgetAvailable = (widget: Widget, scope: ScopeKind) =>
  widget.type === 'carousel'
    ? (widget.slides ?? []).some((slide) =>
        widgetCatalog[slide.type].scopes.includes(scope),
      )
    : widgetCatalog[widget.type].scopes.includes(scope)

export const scopeNames: Record<ScopeKind, string> = {
  all: 'todas as contas',
  account: 'conta',
  card: 'cartão',
}

// texto do diálogo "Adicionar card": onde o widget aparece
export const availabilityLabel = (type: WidgetType) => {
  const scopes = widgetCatalog[type].scopes
  if (scopes.length === ALL_SCOPES.length) return null
  if (scopes.length === 1) return 'Só aparece em "Todas as contas"'
  return 'Não aparece com um cartão selecionado'
}

export const isKnownWidget = (widget: Widget) => widget.type in widgetCatalog

const newId = () => crypto.randomUUID()

export const createWidget = (
  type: WidgetType,
  slides?: Array<SlideType>,
): Widget => {
  const definition = widgetCatalog[type]
  return {
    id: newId(),
    type,
    size: definition.sizes[0],
    ...(definition.charts && { chart: definition.charts[0] }),
    ...(slides && {
      slides: slides.map((slideType) => ({
        type: slideType,
        ...(widgetCatalog[slideType].charts && {
          chart: widgetCatalog[slideType].charts[0],
        }),
      })),
    }),
  }
}

// Sem layout salvo: indicadores no topo, gráficos e listas abaixo
export const defaultLayout: Array<Widget> = [
  { id: 'balance-total', type: 'balance-total', size: 'sm' },
  { id: 'income', type: 'income', size: 'sm' },
  { id: 'expense', type: 'expense', size: 'sm' },
  { id: 'result', type: 'result', size: 'sm' },
  { id: 'evolution', type: 'evolution', size: 'md', chart: 'bar' },
  { id: 'card-limit', type: 'card-limit', size: 'md' },
  { id: 'category-ranking', type: 'category-ranking', size: 'md' },
  {
    id: 'carousel',
    type: 'carousel',
    size: 'md',
    slides: [
      { type: 'expenses-by-category', chart: 'pie' },
      { type: 'spending-by-card' },
    ],
  },
  { id: 'recent-transactions', type: 'recent-transactions', size: 'md' },
  { id: 'upcoming-bills', type: 'upcoming-bills', size: 'md' },
  { id: 'invoices', type: 'invoices', size: 'md' },
  { id: 'balance-by-account', type: 'balance-by-account', size: 'md' },
]
