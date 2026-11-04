import { createFileRoute } from '@tanstack/react-router'
import { Home } from '#/components/home/home'
import { validateDashboardSearch } from '#/lib/dashboard'

export const Route = createFileRoute('/_authenticated/')({
  staticData: { title: 'Início' },
  // período na URL: F5, voltar e link compartilhado mantêm o filtro
  validateSearch: validateDashboardSearch,
  component: Home,
})
