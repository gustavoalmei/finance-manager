import { useEffect, useRef } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { dashboard } from '#/lib/dashboard'
import type { Widget } from '#/lib/dashboard'
import { dashboardLayoutQueryOptions } from '#/lib/dashboard/queries'
import { toaster } from '#/lib/toaster'
import { defaultLayout, isKnownWidget } from './widgets/catalog'

// espera o usuário parar de mexer antes de salvar (arrastar gera várias mudanças)
const SAVE_DELAY_MS = 500

export const useDashboardLayout = () => {
  const queryClient = useQueryClient()
  const { queryKey } = dashboardLayoutQueryOptions()
  const { data, isPending } = useQuery(dashboardLayoutQueryOptions())
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)
  // layout ainda não enviado: salvo ao sair da tela para não perder a mudança
  const pending = useRef<Array<Widget> | null>(null)

  const saveMutation = useMutation({
    mutationFn: (widgets: Array<Widget>) => dashboard.saveLayout(widgets),
    onError: (error) => {
      toaster.error(error)
      // volta para o último layout salvo no back
      queryClient.invalidateQueries({ queryKey })
    },
  })

  useEffect(
    () => () => {
      clearTimeout(timer.current)
      if (pending.current) dashboard.saveLayout(pending.current).catch(() => {})
    },
    [],
  )

  // tipo removido do catálogo não quebra a tela
  const widgets = (data?.widgets ?? defaultLayout).filter(isKnownWidget)

  // atualização otimista: a tela muda na hora e o back recebe depois
  const update = (next: Array<Widget>) => {
    queryClient.setQueryData(queryKey, { widgets: next })
    pending.current = next
    clearTimeout(timer.current)
    timer.current = setTimeout(() => {
      pending.current = null
      saveMutation.mutate(next)
    }, SAVE_DELAY_MS)
  }

  return {
    widgets,
    isPending,
    update,
    reset: () => update(defaultLayout),
  }
}
