import { queryOptions } from '@tanstack/react-query'
import { categories } from '.'

export const categoriesQueryOptions = () =>
  queryOptions({
    queryKey: ['categories'],
    queryFn: () => categories.list(),
  })
