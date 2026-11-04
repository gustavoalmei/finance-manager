import { ArrowDownRight, ArrowUpRight } from 'lucide-react'
import type { DashboardSummary } from '#/lib/dashboard'
import { formatCents } from '#/lib/format'
import { cn } from '#/lib/utils'

type KpiProps = { summary: DashboardSummary }

const monthFormatter = new Intl.DateTimeFormat('pt-BR', {
  month: 'short',
  timeZone: 'UTC',
})

// "vs set", "vs 2025" ou "vs período anterior" (datas do back em UTC).
// Vale também para o mês financeiro: 05/09–04/10 é "set" (o ciclo leva o mês em que começa).
export const previousLabel = ({
  start,
  end,
}: DashboardSummary['previousPeriod']) => {
  const from = new Date(start)
  // dia seguinte ao fim: num período de meses inteiros, cai no mesmo dia do início
  const next = new Date(new Date(end).getTime() + 1)
  if (from.getUTCDate() === next.getUTCDate()) {
    const months =
      (next.getUTCFullYear() - from.getUTCFullYear()) * 12 +
      (next.getUTCMonth() - from.getUTCMonth())
    if (months === 1)
      return `vs ${monthFormatter.format(from).replace('.', '')}`
    if (months === 12 && from.getUTCMonth() === 0) {
      return `vs ${from.getUTCFullYear()}`
    }
  }
  return 'vs período anterior'
}

type DeltaProps = {
  current: number
  previous: number
  label: string
  // despesa: subir é ruim
  higherIsBetter: boolean
}

// Variação com seta + texto: a cor nunca é o único sinal
const Delta = ({ current, previous, label, higherIsBetter }: DeltaProps) => {
  if (previous === 0) {
    return (
      <p className="text-xs text-muted-foreground">Sem dados para comparar</p>
    )
  }

  const change = (current - previous) / Math.abs(previous)
  const isUp = change >= 0
  const isGood = isUp === higherIsBetter
  const Icon = isUp ? ArrowUpRight : ArrowDownRight

  return (
    <p className="flex items-center gap-1 text-xs text-muted-foreground">
      <span
        className={cn(
          'flex items-center font-semibold',
          isGood ? 'text-success' : 'text-destructive-text',
        )}
      >
        <Icon aria-hidden className="size-3.5" />
        {Math.abs(change).toLocaleString('pt-BR', {
          style: 'percent',
          maximumFractionDigits: 1,
        })}
      </span>
      {label}
    </p>
  )
}

const KpiValue = ({ cents }: { cents: number }) => (
  <p className="sensitive text-2xl font-bold tabular-nums">
    {formatCents(cents)}
  </p>
)

export const BalanceTotalWidget = ({ summary }: KpiProps) => {
  const count = summary.balance.accounts.length

  return (
    <div className="flex flex-col gap-1">
      <KpiValue cents={summary.balance.total} />
      <p className="text-xs text-muted-foreground">
        {count === 1 ? 'em 1 conta' : `em ${count} contas`}
      </p>
    </div>
  )
}

export const IncomeWidget = ({ summary }: KpiProps) => (
  <div className="flex flex-col gap-1">
    <KpiValue cents={summary.totals.income} />
    <Delta
      current={summary.totals.income}
      previous={summary.previousTotals.income}
      label={previousLabel(summary.previousPeriod)}
      higherIsBetter
    />
    {summary.totals.pendingIncome > 0 && (
      <p className="text-xs text-warning">
        +{' '}
        <span className="sensitive">
          {formatCents(summary.totals.pendingIncome)}
        </span>{' '}
        a receber
      </p>
    )}
  </div>
)

export const ExpenseWidget = ({ summary }: KpiProps) => (
  <div className="flex flex-col gap-1">
    <KpiValue cents={summary.totals.expense} />
    <Delta
      current={summary.totals.expense}
      previous={summary.previousTotals.expense}
      label={previousLabel(summary.previousPeriod)}
      higherIsBetter={false}
    />
    {summary.totals.pendingExpense > 0 && (
      <p className="text-xs text-warning">
        +{' '}
        <span className="sensitive">
          {formatCents(summary.totals.pendingExpense)}
        </span>{' '}
        a pagar
      </p>
    )}
  </div>
)

export const ResultWidget = ({ summary }: KpiProps) => {
  const transfers = summary.transfers

  return (
    <div className="flex flex-col gap-1">
      <KpiValue cents={summary.totals.result} />
      <Delta
        current={summary.totals.result}
        previous={summary.previousTotals.result}
        label={previousLabel(summary.previousPeriod)}
        higherIsBetter
      />
      {/* explica a diferença entre o resultado e o que mudou no saldo */}
      {transfers && (transfers.incoming > 0 || transfers.outgoing > 0) && (
        <p className="text-xs text-muted-foreground">
          Transferências (fora do resultado):{' '}
          <span className="sensitive tabular-nums">
            +{formatCents(transfers.incoming)} · −
            {formatCents(transfers.outgoing)}
          </span>
        </p>
      )}
    </div>
  )
}
