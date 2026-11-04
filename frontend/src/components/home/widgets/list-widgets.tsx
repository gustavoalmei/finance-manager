import { Link } from '@tanstack/react-router'
import type { DashboardSummary, ScopeKind } from '#/lib/dashboard'
import { formatCents, formatDateUTC } from '#/lib/format'
import { WidgetEmpty } from './widget-empty'

type ListWidgetProps = { summary: DashboardSummary }

const monthFormatter = new Intl.DateTimeFormat('pt-BR', {
  month: 'short',
  timeZone: 'UTC',
})

// Um único série (gasto) por cartão: uma cor só, a barra mostra a proporção
export const CardSpendingWidget = ({ summary }: ListWidgetProps) => {
  const rows = summary.spendingByCard
  const total = rows.reduce((sum, row) => sum + row.amount, 0)

  if (total === 0) {
    return <WidgetEmpty>Nenhuma compra no cartão neste período</WidgetEmpty>
  }

  return (
    <ul className="flex flex-col gap-3 text-sm">
      {rows.map((row) => (
        <li key={row.cardId} className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="min-w-0 flex-1 truncate">{row.name}</span>
            <span className="sensitive font-semibold tabular-nums">
              {formatCents(row.amount)}
            </span>
          </div>
          <div className="h-2 rounded-full bg-muted">
            <div
              className="h-full rounded-full"
              style={{
                width: `${(row.amount / total) * 100}%`,
                background: 'var(--chart-blue)',
              }}
            />
          </div>
        </li>
      ))}
    </ul>
  )
}

type CardListProps = ListWidgetProps & { scope: ScopeKind }

// com conta selecionada, "nenhum cartão" é só nesta conta
const NoCards = ({ scope }: { scope: ScopeKind }) => (
  <WidgetEmpty>
    <span>
      {scope === 'account'
        ? 'Nenhum cartão nesta conta.'
        : 'Nenhum cartão cadastrado.'}{' '}
      <Link to="/credit-card" className="text-foreground underline">
        Cadastrar cartão
      </Link>
    </span>
  </WidgetEmpty>
)

// Não depende do período: fatura aberta hoje + as próximas (parcelas já lançadas)
export const InvoicesWidget = ({ summary, scope }: CardListProps) => {
  if (summary.invoices.length === 0) return <NoCards scope={scope} />

  return (
    <ul className="flex flex-col divide-y divide-border">
      {summary.invoices.map((invoice) => {
        return (
          <li
            key={invoice.cardId}
            className="flex flex-col gap-2 py-3 first:pt-0 last:pb-0"
          >
            <div className="flex items-baseline justify-between gap-2">
              <span className="truncate text-sm font-medium">
                {invoice.name}
              </span>
              <span className="sensitive text-lg font-bold tabular-nums">
                {formatCents(invoice.current.amount)}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Fecha {formatDateUTC(invoice.current.closingDate)} · vence{' '}
              {formatDateUTC(invoice.current.dueDate)}
            </p>
            <dl className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
              {invoice.upcoming.map((next) => (
                <div key={next.closingDate} className="flex gap-1">
                  <dt className="text-muted-foreground capitalize">
                    {monthFormatter
                      .format(new Date(next.dueDate))
                      .replace('.', '')}
                  </dt>
                  <dd className="sensitive font-semibold tabular-nums">
                    {formatCents(next.amount)}
                  </dd>
                </div>
              ))}
            </dl>
          </li>
        )
      })}
    </ul>
  )
}

export const AccountsWidget = ({ summary }: ListWidgetProps) => {
  if (summary.balance.accounts.length === 0) {
    return (
      <WidgetEmpty>
        <span>
          Nenhuma conta cadastrada.{' '}
          <Link to="/accounts" className="text-foreground underline">
            Criar conta
          </Link>
        </span>
      </WidgetEmpty>
    )
  }

  return (
    <ul className="flex flex-col divide-y divide-border text-sm">
      {summary.balance.accounts.map((account) => (
        <li
          key={account.id}
          className="flex items-center justify-between gap-2 py-2 first:pt-0 last:pb-0"
        >
          <div className="min-w-0">
            <p className="truncate font-medium">{account.name}</p>
            <p className="truncate text-xs text-muted-foreground">
              {account.type}
            </p>
          </div>
          <span className="sensitive font-semibold tabular-nums">
            {formatCents(account.balance)}
          </span>
        </li>
      ))}
    </ul>
  )
}
