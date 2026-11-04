import { useQuery } from '@tanstack/react-query'
import { useAccountSelection } from '#/components/accounts/account-selection-context'
import { creditCardsQueryOptions } from '#/lib/creditCard/queries'

// Cartões da conta selecionada no header (todos, se nenhuma conta estiver selecionada).
// select filtra a partir do mesmo cache ['credit-cards']: trocar de conta não refaz a busca.
export const useAccountCreditCards = () => {
  const { selectedAccount } = useAccountSelection()
  const accountId = selectedAccount?.id

  return useQuery({
    ...creditCardsQueryOptions(),
    select: (cards) => (accountId ? cards.filter((card) => card.accountId === accountId) : cards),
  })
}
