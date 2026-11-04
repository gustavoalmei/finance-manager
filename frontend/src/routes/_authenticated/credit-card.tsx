import { CreditCards } from '#/components/credit-cards'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/credit-card')({
  staticData: { title: 'Cartões' },
  component: CreditCards,
})
