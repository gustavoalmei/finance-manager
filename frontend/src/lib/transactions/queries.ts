import { queryOptions } from '@tanstack/react-query'
import { transactions } from '.'
import type { TransactionFilters } from '.'

// a lista de modelos gratuitos muda pouco (o back também guarda por 1h)
export const aiModelsQueryOptions = () =>
  queryOptions({
    queryKey: ['ai-models'],
    queryFn: () => transactions.aiModels(),
    staleTime: 60 * 60 * 1000,
  })

export const transactionsQueryOptions = (filters: TransactionFilters = {}) =>
  queryOptions({
    // prefixo ['transactions']: invalidar ele atualiza todos os filtros
    queryKey: ['transactions', filters],
    queryFn: () => transactions.list(filters),
  })
