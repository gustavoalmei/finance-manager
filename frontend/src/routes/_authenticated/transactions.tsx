import { Transactions } from '#/components/transactions'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/transactions')({
  staticData: { title: 'Transações' },
  component: Transactions,
})
