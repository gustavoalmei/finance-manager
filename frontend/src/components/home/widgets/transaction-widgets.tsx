import type { ReactNode } from 'react'
import { Link } from '@tanstack/react-router'
import { ArrowRight, CircleAlert } from 'lucide-react'
import type { DashboardSummary, DashboardTransaction } from '#/lib/dashboard'
import { formatCents, formatDateUTC } from '#/lib/format'
import { isoToDay } from '#/lib/transactions'
import type { TransactionType } from '#/lib/transactions'
import { cn } from '#/lib/utils'
import { CategoryChip } from './category-chip'
import { WidgetEmpty } from './widget-empty'

// mesmo padrão da tela de transações: sinal e cor dizem a direção do dinheiro
const amountStyles: Record<
  TransactionType,
  { sign: string; className: string }
> = {
  INCOME: { sign: '+', className: 'text-success' },
  EXPENSE: { sign: '−', className: 'text-destructive-text' },
  TRANSFER: { sign: '', className: 'text-foreground' },
}

const ONE_DAY_MS = 86_400_000

type TransactionRowProps = {
  item: DashboardTransaction
  // linha de baixo à direita: data ou prazo
  aside: ReactNode
}

const TransactionRow = ({ item, aside }: TransactionRowProps) => {
  const { sign, className } = amountStyles[item.type]
  const installment = item.totalInstallments
    ? ` ${item.installmentNumber}/${item.totalInstallments}`
    : ''

  return (
    <li className="-mx-2 flex items-center gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-muted">
      <CategoryChip color={item.category.color} icon={item.category.icon} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">
          {item.description}
          {installment && (
            <span className="text-muted-foreground">{installment}</span>
          )}
        </p>
        <p className="truncate text-xs text-muted-foreground">
          {item.category.name} · {item.source}
        </p>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-0.5">
        <span
          className={cn(
            'sensitive text-sm font-semibold tabular-nums',
            className,
          )}
        >
          {sign}
          {formatCents(item.amount)}
        </span>
        {aside}
      </div>
    </li>
  )
}

const SeeAll = ({ children }: { children: ReactNode }) => (
  <Link
    to="/transactions"
    className="mt-1 flex items-center gap-1 self-end text-xs font-medium text-muted-foreground hover:text-foreground"
  >
    {children} <ArrowRight className="size-3.5" />
  </Link>
)

type ListWidgetProps = { summary: DashboardSummary }

export const RecentTransactionsWidget = ({ summary }: ListWidgetProps) => {
  if (summary.recentTransactions.length === 0) {
    return <WidgetEmpty>Nenhuma transação neste período</WidgetEmpty>
  }

  return (
    <div className="flex flex-col">
      <ul className="flex flex-col">
        {summary.recentTransactions.map((item) => (
          <TransactionRow
            key={item.id}
            item={item}
            aside={
              <span className="text-xs text-muted-foreground tabular-nums">
                {formatDateUTC(item.date).slice(0, 5)}
              </span>
            }
          />
        ))}
      </ul>
      <SeeAll>Ver todas</SeeAll>
    </div>
  )
}

// dias até o vencimento: negativo = atrasada (datas salvas à meia-noite UTC)
const daysUntil = (iso: string) => {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  return Math.round((isoToDay(iso).getTime() - today.getTime()) / ONE_DAY_MS)
}

const plural = (days: number) => (days === 1 ? '1 dia' : `${days} dias`)

// Prazo com texto (e ícone quando atrasada): a cor nunca é o único sinal
const DueLabel = ({ iso }: { iso: string }) => {
  const days = daysUntil(iso)

  if (days < 0) {
    return (
      <span className="flex items-center gap-1 text-xs font-medium text-destructive-text">
        <CircleAlert aria-hidden className="size-3.5" />
        Atrasada há {plural(-days)}
      </span>
    )
  }
  if (days === 0) {
    return <span className="text-xs font-medium text-warning">Vence hoje</span>
  }
  return (
    <span className="text-xs text-muted-foreground">
      Em {plural(days)} · {formatDateUTC(iso).slice(0, 5)}
    </span>
  )
}

export const PendingBillsWidget = ({ summary }: ListWidgetProps) => {
  if (summary.pendingBills.length === 0) {
    return <WidgetEmpty>Nenhuma conta pendente. Tudo em dia!</WidgetEmpty>
  }

  return (
    <div className="flex flex-col">
      <ul className="flex flex-col">
        {summary.pendingBills.map((item) => (
          <TransactionRow
            key={item.id}
            item={item}
            aside={<DueLabel iso={item.date} />}
          />
        ))}
      </ul>
      <SeeAll>Ver transações</SeeAll>
    </div>
  )
}
