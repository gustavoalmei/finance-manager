import { keepPreviousData, queryOptions } from '@tanstack/react-query'
import { dashboard, formatDay } from '.'
import type { DashboardScope } from '.'
import type { Period } from '../transactions'

export const dashboardSummaryQueryOptions = (
  period: Period,
  scope: DashboardScope,
) =>
  queryOptions({
    // dias como texto: Date na key não é comparado por valor
    queryKey: [
      'dashboard',
      'summary',
      formatDay(period.from),
      formatDay(period.to),
      scope,
    ],
    queryFn: () => dashboard.summary(period, scope),
    // ao trocar o período, mantém os números antigos até os novos chegarem
    placeholderData: keepPreviousData,
  })

export const dashboardLayoutQueryOptions = () =>
  queryOptions({
    queryKey: ['dashboard', 'layout'],
    queryFn: () => dashboard.getLayout(),
    // o layout só muda por esta tela
    staleTime: Infinity,
  })
