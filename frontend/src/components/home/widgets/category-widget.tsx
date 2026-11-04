import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import { categoryColorVar, getCategoryIcon } from '#/lib/categories'
import type { ChartKind, DashboardSummary } from '#/lib/dashboard'
import { formatCents } from '#/lib/format'
import { WidgetEmpty } from './widget-empty'

// pizza legível: até 5 fatias + "Outras"
const TOP_CATEGORIES = 5

type Slice = {
  key: string
  name: string
  icon: string
  color: string
  amount: number
}

const toSlices = (
  rows: DashboardSummary['expensesByCategory'],
): Array<Slice> => {
  const top = rows.slice(0, TOP_CATEGORIES).map((row) => ({
    key: row.categoryId,
    name: row.name,
    icon: row.icon,
    // a cor é da categoria, não da posição no ranking
    color: categoryColorVar(row.color),
    amount: row.amount,
  }))
  const rest = rows.slice(TOP_CATEGORIES)
  if (rest.length === 0) return top

  return [
    ...top,
    {
      key: 'other',
      name: `Outras (${rest.length})`,
      icon: 'tag',
      color: 'var(--chart-other)',
      amount: rest.reduce((total, row) => total + row.amount, 0),
    },
  ]
}

const percentFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'percent',
  maximumFractionDigits: 0,
})

type CategoryWidgetProps = {
  summary: DashboardSummary
  chart?: ChartKind
}

export const CategoryWidget = ({ summary, chart }: CategoryWidgetProps) => {
  const slices = toSlices(summary.expensesByCategory)
  const total = slices.reduce((sum, slice) => sum + slice.amount, 0)

  if (total === 0) {
    return <WidgetEmpty>Nenhuma despesa neste período</WidgetEmpty>
  }

  // lista com nome, valor e %: é também a legenda e a versão em texto do gráfico
  const list = (
    <ul className="flex min-w-0 flex-1 flex-col gap-2 text-sm">
      {slices.map((slice) => {
        const Icon = getCategoryIcon(slice.icon)
        const share = slice.amount / total

        return (
          <li key={slice.key} className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <Icon
                aria-hidden
                className="size-4 shrink-0"
                style={{ color: slice.color }}
              />
              <span className="min-w-0 flex-1 truncate">{slice.name}</span>
              <span className="sensitive font-semibold tabular-nums">
                {formatCents(slice.amount)}
              </span>
              <span className="w-10 text-right text-xs text-muted-foreground tabular-nums">
                {percentFormatter.format(share)}
              </span>
            </div>
            {chart === 'bar' && (
              <div className="h-2 rounded-full bg-muted">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${share * 100}%`, background: slice.color }}
                />
              </div>
            )}
          </li>
        )
      })}
    </ul>
  )

  if (chart === 'bar') return list

  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row">
      <figure
        aria-label={`Despesas por categoria, total ${formatCents(total)}`}
        className="relative size-40 shrink-0"
      >
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={slices}
              dataKey="amount"
              nameKey="name"
              innerRadius="62%"
              outerRadius="100%"
              // 2px da cor do fundo entre as fatias
              stroke="var(--background)"
              strokeWidth={2}
              isAnimationActive={false}
            >
              {slices.map((slice) => (
                <Cell key={slice.key} fill={slice.color} />
              ))}
            </Pie>
            <Tooltip
              content={({ active, payload }) => {
                const slice = payload[0]?.payload as Slice | undefined
                return active && slice ? (
                  <div className="rounded-lg border border-border bg-popover p-2 text-xs shadow-md">
                    {slice.name}:{' '}
                    <span className="sensitive font-semibold tabular-nums">
                      {formatCents(slice.amount)}
                    </span>
                  </div>
                ) : null
              }}
            />
          </PieChart>
        </ResponsiveContainer>
        <figcaption className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xs text-muted-foreground">Total</span>
          <span className="sensitive text-sm font-bold tabular-nums">
            {formatCents(total)}
          </span>
        </figcaption>
      </figure>
      {list}
    </div>
  )
}
