import { useState } from 'react'
import { ArrowDownRight, ArrowUpRight, ChevronDown } from 'lucide-react'
import { categoryColorVar } from '#/lib/categories'
import type { DashboardSummary } from '#/lib/dashboard'
import { formatCents } from '#/lib/format'
import { cn } from '#/lib/utils'
import { CategoryChip } from './category-chip'
import { previousLabel } from './kpi-widgets'
import { WidgetEmpty } from './widget-empty'

// fechado mostra o pódio + 2; "Ver todas" abre o resto
const COLLAPSED_COUNT = 5

const percentFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'percent',
  maximumFractionDigits: 0,
})

type Row = DashboardSummary['expensesByCategory'][number]

// Gastar mais que no período anterior é ruim: seta + texto, nunca só a cor
const Change = ({ row, label }: { row: Row; label: string }) => {
  if (row.previousAmount === 0) {
    return (
      <span className="rounded-full bg-muted px-1.5 py-0.5 text-[11px] text-muted-foreground">
        Novo
      </span>
    )
  }

  const change = (row.amount - row.previousAmount) / row.previousAmount
  const isUp = change >= 0
  const Icon = isUp ? ArrowUpRight : ArrowDownRight

  return (
    <span
      title={`${label}: ${formatCents(row.previousAmount)}`}
      className={cn(
        'flex items-center text-xs font-semibold tabular-nums',
        isUp ? 'text-destructive-text' : 'text-success',
      )}
    >
      <Icon aria-hidden className="size-3.5" />
      {percentFormatter.format(Math.abs(change))}
      <span className="sr-only"> {label}</span>
    </span>
  )
}

export const CategoryRankingWidget = ({
  summary,
}: {
  summary: DashboardSummary
}) => {
  const [expanded, setExpanded] = useState(false)
  const rows = summary.expensesByCategory
  const total = rows.reduce((sum, row) => sum + row.amount, 0)
  const label = previousLabel(summary.previousPeriod)

  if (total === 0) {
    return <WidgetEmpty>Nenhuma despesa neste período</WidgetEmpty>
  }

  const visible = expanded ? rows : rows.slice(0, COLLAPSED_COUNT)
  // a maior categoria ocupa a barra inteira: as outras ficam proporcionais a ela
  const max = rows[0]?.amount ?? 1

  return (
    <div className="flex flex-col gap-2">
      <ol className="flex flex-col gap-1">
        {visible.map((row, index) => (
          <li
            key={row.categoryId}
            className="-mx-2 flex items-center gap-3 rounded-lg px-2 py-1.5 transition-colors hover:bg-muted"
          >
            <span
              className={cn(
                'w-5 shrink-0 text-center text-sm font-bold tabular-nums',
                index < 3 ? 'text-foreground' : 'text-muted-foreground',
              )}
            >
              {index + 1}º
            </span>
            <CategoryChip color={row.color} icon={row.icon} />
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <div className="flex items-center gap-2">
                <span className="min-w-0 flex-1 truncate text-sm font-medium">
                  {row.name}
                </span>
                <span className="sensitive text-sm font-semibold tabular-nums">
                  {formatCents(row.amount)}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-1.5 flex-1 rounded-full bg-muted">
                  <div
                    className="h-full rounded-full transition-[width] duration-500"
                    style={{
                      width: `${(row.amount / max) * 100}%`,
                      background: categoryColorVar(row.color),
                    }}
                  />
                </div>
                <span className="w-9 text-right text-xs text-muted-foreground tabular-nums">
                  {percentFormatter.format(row.amount / total)}
                </span>
                <Change row={row} label={label} />
              </div>
            </div>
          </li>
        ))}
      </ol>

      {rows.length > COLLAPSED_COUNT && (
        <button
          type="button"
          aria-expanded={expanded}
          onClick={() => setExpanded((current) => !current)}
          className="flex cursor-pointer items-center gap-1 self-center rounded-md px-2 py-1 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          {expanded ? 'Ver menos' : `Ver todas (${rows.length})`}
          <ChevronDown
            aria-hidden
            className={cn(
              'size-3.5 transition-transform',
              expanded && 'rotate-180',
            )}
          />
        </button>
      )}
    </div>
  )
}
