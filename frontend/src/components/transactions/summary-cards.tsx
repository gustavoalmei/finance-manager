import { Skeleton } from '#/components/ui/skeleton'
import type { Transaction } from '#/lib/transactions'
import { formatCurrency } from '#/lib/format'
import { cn } from '#/lib/utils'

// Calculado no front enquanto o back não tem rota de resumo.
// Canceladas ficam de fora; transferências não são receita nem despesa.
const summarize = (items: Array<Transaction>) => {
  const confirmed = items.filter((item) => item.status === 'CONFIRMED')
  const sum = (type: Transaction['type']) =>
    confirmed
      .filter((item) => item.type === type)
      .reduce((total, item) => total + item.amount, 0)

  const income = sum('INCOME')
  const expense = sum('EXPENSE')

  return {
    income,
    expense,
    balance: income - expense,
    pending: items.filter((item) => item.status === 'PENDING').length,
  }
}

const pluralize = (count: number) =>
  `${count} ${count === 1 ? 'lançamento' : 'lançamentos'}`

type SummaryCardsProps = {
  transactions: Array<Transaction>
  isLoading: boolean
}

export const SummaryCards = ({
  transactions,
  isLoading,
}: SummaryCardsProps) => {
  const { income, expense, balance, pending } = summarize(transactions)

  const cards = [
    {
      label: 'Receitas',
      value: formatCurrency(income / 100),
      // sensitive: borra com "Ocultar valores"
      className: 'sensitive text-success',
    },
    {
      label: 'Despesas',
      value: formatCurrency(expense / 100),
      className: 'sensitive text-destructive-text',
    },
    {
      label: 'Saldo do mês',
      value: formatCurrency(balance / 100),
      className: 'sensitive text-foreground',
    },
    {
      label: 'Pendentes',
      value: pluralize(pending),
      className: 'text-warning',
    },
  ]

  return (
    <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => (
        <div
          key={card.label}
          className="flex flex-col gap-2 rounded-xl bg-item p-5"
        >
          <dt className="text-lg text-muted-foreground">{card.label}</dt>
          <dd className={cn('text-2xl font-bold tabular-nums', card.className)}>
            {isLoading ? <Skeleton className="h-8 w-40" /> : card.value}
          </dd>
        </div>
      ))}
    </dl>
  )
}
