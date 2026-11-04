import { queryOptions } from '@tanstack/react-query'
import { creditCards } from '.'

export const creditCardsQueryOptions = () =>
  queryOptions({
    queryKey: ['credit-cards'],
    queryFn: () => creditCards.list(),
  })
