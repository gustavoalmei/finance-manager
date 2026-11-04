import { createFileRoute } from '@tanstack/react-router'
import { Accounts } from '#/components/accounts/index'

export const Route = createFileRoute('/_authenticated/accounts')({
  staticData: { title: 'Contas' },
  component: Accounts,
})
