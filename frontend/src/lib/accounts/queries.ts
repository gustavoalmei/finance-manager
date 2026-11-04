import { queryOptions } from '@tanstack/react-query'
import { accounts } from '.'

// Centraliza a queryKey e o fetch: use em useQuery, prefetch e invalidateQueries.
export const accountsQueryOptions = () =>
  queryOptions({
    queryKey: ['accounts'],
    queryFn: () => accounts.list(),
  })
