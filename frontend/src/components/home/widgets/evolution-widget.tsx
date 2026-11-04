import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { ChartKind, DashboardSummary, ScopeKind } from '#/lib/dashboard'
import { formatCents, formatCompactCurrency } from '#/lib/format'
import { WidgetEmpty } from './widget-empty'

// receita e despesa são identidades (slots 1 e 2 da paleta), não "bom/ruim"
const allSeries = [
  { key: 'income', label: 'Receitas', color: 'var(--chart-blue)' },
  { key: 'expense', label: 'Despesas', color: 'var(--chart-orange)' },
] as const

const monthFormatter = new Intl.DateTimeFormat('pt-BR', {
  month: 'short',
  year: '2-digit',
  timeZone: 'UTC',
})
const dayFormatter = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: '2-digit',
  timeZone: 'UTC',
})

// bucket "aaaa-mm-dd" ou "aaaa-mm" → texto do eixo/tooltip
const formatBucket = (bucket: string) =>
  bucket.length === 7
    ? monthFormatter.format(new Date(`${bucket}-01T00:00:00Z`)).replace('.', '')
    : dayFormatter.format(new Date(`${bucket}T00:00:00Z`))

// Tooltip do mês financeiro: "out/26 (05/10 – 04/11)"; no mês do calendário, só o mês
const formatBucketRange = (bucket: string, startDay: number) => {
  if (bucket.length !== 7 || startDay === 1) return formatBucket(bucket)
  const [year, month] = bucket.split('-').map(Number) as [number, number]
  const from = new Date(Date.UTC(year, month - 1, startDay))
  const to = new Date(Date.UTC(year, month, startDay - 1))
  return `${formatBucket(bucket)} (${dayFormatter.format(from)} – ${dayFormatter.format(to)})`
}

type EvolutionWidgetProps = {
  summary: DashboardSummary
  chart?: ChartKind
  scope: ScopeKind
}

export const EvolutionWidget = ({
  summary,
  chart,
  scope,
}: EvolutionWidgetProps) => {
  // cartão não tem receita: só a série de compras (mesma cor, a cor segue a série)
  const series =
    scope === 'card' ? [{ ...allSeries[1], label: 'Compras' }] : allSeries
  const data = summary.evolution
  const hasData = data.some((point) => point.income > 0 || point.expense > 0)

  if (!hasData) {
    return (
      <WidgetEmpty>
        {scope === 'card'
          ? 'Nenhuma compra neste período'
          : 'Nenhuma receita ou despesa neste período'}
      </WidgetEmpty>
    )
  }

  // legenda com o total: rótulo visível (as cores mais claras têm pouco contraste)
  const legend = (
    <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
      {series.map((item) => (
        <li key={item.key} className="flex items-center gap-1.5">
          <span
            aria-hidden
            className="size-2.5 rounded-sm"
            style={{ background: item.color }}
          />
          <span className="text-muted-foreground">{item.label}</span>
          <span className="sensitive font-semibold tabular-nums">
            {formatCents(summary.totals[item.key])}
          </span>
        </li>
      ))}
    </ul>
  )

  const axes = (
    <>
      <CartesianGrid vertical={false} stroke="var(--border-strong)" />
      <XAxis
        dataKey="bucket"
        tickFormatter={formatBucket}
        tickLine={false}
        axisLine={{ stroke: 'var(--border-strong)' }}
        tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }}
        minTickGap={12}
      />
      <YAxis
        className="sensitive"
        tickFormatter={(cents: number) => formatCompactCurrency(cents / 100)}
        tickLine={false}
        axisLine={false}
        tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }}
        width={72}
      />
      <Tooltip
        cursor={{ fill: 'var(--muted)', stroke: 'var(--border-strong)' }}
        content={({ active, payload, label }) =>
          active && payload.length ? (
            <div className="flex flex-col gap-1 rounded-lg border border-border bg-popover p-2 text-xs shadow-md">
              <span className="font-semibold">
                {formatBucketRange(String(label), summary.period.monthStartDay)}
              </span>
              {series.map((item) => {
                const entry = payload.find((row) => row.dataKey === item.key)
                return (
                  <span key={item.key} className="flex items-center gap-1.5">
                    <span
                      aria-hidden
                      className="size-2 rounded-sm"
                      style={{ background: item.color }}
                    />
                    {item.label}:
                    <span className="sensitive font-semibold tabular-nums">
                      {formatCents(Number(entry?.value ?? 0))}
                    </span>
                  </span>
                )
              })}
            </div>
          ) : null
        }
      />
    </>
  )

  return (
    <figure
      aria-label={`Evolução: ${series
        .map((item) => `${item.label} ${formatCents(summary.totals[item.key])}`)
        .join(', ')}`}
      className="flex flex-col gap-3"
    >
      {legend}
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          {chart === 'line' ? (
            <LineChart
              data={data}
              margin={{ top: 4, right: 8, left: 0, bottom: 0 }}
            >
              {axes}
              {series.map((item) => (
                <Line
                  key={item.key}
                  dataKey={item.key}
                  name={item.label}
                  stroke={item.color}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{
                    r: 4,
                    stroke: 'var(--background)',
                    strokeWidth: 2,
                  }}
                  type="monotone"
                />
              ))}
            </LineChart>
          ) : (
            <BarChart
              data={data}
              margin={{ top: 4, right: 8, left: 0, bottom: 0 }}
              barGap={2}
            >
              {axes}
              {series.map((item) => (
                <Bar
                  key={item.key}
                  dataKey={item.key}
                  name={item.label}
                  fill={item.color}
                  radius={[4, 4, 0, 0]}
                  maxBarSize={24}
                />
              ))}
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>
    </figure>
  )
}
