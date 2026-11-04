import { useQuery } from '@tanstack/react-query'
import { userQueryOptions } from '#/lib/auth/queries'

// Dia em que o mês financeiro começa; 1 (mês do calendário) até o /me responder
export const useMonthStartDay = () => {
  const { data: user } = useQuery(userQueryOptions())
  return user?.monthStartDay ?? 1
}
