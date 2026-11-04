import { queryOptions } from '@tanstack/react-query'
import type { QueryClient } from '@tanstack/react-query'
import { auth } from '.'

// staleTime: sem ele (padrão 0) cada navegação e cada preload por hover
// dispara um novo GET /me. Login/logout limpam esse cache explicitamente.
export const userQueryOptions = () =>
  queryOptions({
    queryKey: ['user'],
    queryFn: () => auth.checkSession(),
    staleTime: 5 * 60 * 1000,
  })

// Usado no beforeLoad das rotas: usuário logado ou null
export const getSessionUser = (queryClient: QueryClient) =>
  queryClient.query(userQueryOptions()).catch(() => null)
