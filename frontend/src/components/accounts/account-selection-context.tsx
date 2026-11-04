import { createContext, useContext } from 'react'
import type { ReactNode } from 'react'
import { useQuery } from '@tanstack/react-query'
import { usePersistedId } from '#/hooks/use-persisted-id'
import type { Account } from '#/lib/accounts'
import { accountsQueryOptions } from '#/lib/accounts/queries'
import type { CreditCard } from '#/lib/creditCard'
import { creditCardsQueryOptions } from '#/lib/creditCard/queries'

const STORAGE_KEYS = {
  account: 'finance-manager-selected-account',
  card: 'finance-manager-selected-card',
}

type AccountSelection = {
  selectedAccount: Account | null
  setSelectedAccount: (account: Account) => void
  selectedCard: CreditCard | null
  setSelectedCard: (card: CreditCard) => void
  // ids lidos do storage e listas carregadas: a seleção já é a definitiva
  isSelectionReady: boolean
}

const AccountSelectionContext = createContext<AccountSelection | null>(null)

// Compartilhado entre header, barra mobile e rotas filhas.
// Guarda só os ids (persistidos); os objetos vêm do cache, então edições
// aparecem na hora e itens excluídos deixam de estar selecionados.
export const AccountSelectionProvider = ({
  children,
}: {
  children: ReactNode
}) => {
  const { data: accounts = [], isPending: accountsPending } = useQuery(
    accountsQueryOptions(),
  )
  const { data: cards = [], isPending: cardsPending } = useQuery(
    creditCardsQueryOptions(),
  )
  const [accountId, setAccountId, accountLoaded] = usePersistedId(
    STORAGE_KEYS.account,
  )
  const [cardId, setCardId, cardLoaded] = usePersistedId(STORAGE_KEYS.card)
  const isSelectionReady =
    accountLoaded && cardLoaded && !accountsPending && !cardsPending

  const selectedAccount =
    accounts.find((account) => account.id === accountId) ?? null
  const selectedCard = cards.find((card) => card.id === cardId) ?? null

  // cartão de outra conta deixa de valer ao trocar a conta
  const setSelectedAccount = (account: Account) => {
    setAccountId(account.id)
    if (selectedCard && selectedCard.accountId !== account.id) setCardId(null)
  }

  const setSelectedCard = (card: CreditCard) => setCardId(card.id)

  return (
    <AccountSelectionContext.Provider
      value={{
        selectedAccount,
        setSelectedAccount,
        selectedCard,
        setSelectedCard,
        isSelectionReady,
      }}
    >
      {children}
    </AccountSelectionContext.Provider>
  )
}

export const useAccountSelection = () => {
  const context = useContext(AccountSelectionContext)
  if (!context) {
    throw new Error(
      'useAccountSelection deve ser usado dentro de <AccountSelectionProvider>',
    )
  }
  return context
}
