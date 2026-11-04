import { createFileRoute } from '@tanstack/react-router'
import { Settings } from '#/components/settings/settings'

export const Route = createFileRoute('/_authenticated/configuracoes')({
  staticData: { title: 'Configurações' },
  component: Settings,
})
