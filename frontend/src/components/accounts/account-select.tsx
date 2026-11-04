import { useQuery } from '@tanstack/react-query'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#/components/ui/select'
import { accountsQueryOptions } from '#/lib/accounts/queries'
import { useAccountSelection } from './account-selection-context'

// Conta inicial dos formulários: a do header; sem seleção, a primeira
export const useDefaultAccountId = () => {
  const { selectedAccount } = useAccountSelection()
  const { data: accounts = [] } = useQuery(accountsQueryOptions())
  return selectedAccount?.id ?? accounts.at(0)?.id ?? null
}

type AccountSelectProps = {
  id: string
  value: string | null
  onChange: (accountId: string | null) => void
  invalid?: boolean
  className?: string
}

export const AccountSelect = ({
  id,
  value,
  onChange,
  invalid,
  className,
}: AccountSelectProps) => {
  const { data: accounts = [] } = useQuery(accountsQueryOptions())
  const items = Object.fromEntries(
    accounts.map((account) => [account.id, account.name]),
  )

  return (
    <Select items={items} value={value} onValueChange={onChange}>
      <SelectTrigger id={id} aria-invalid={invalid} className={className}>
        <SelectValue placeholder="Selecione" />
      </SelectTrigger>
      <SelectContent>
        {accounts.map((account) => (
          <SelectItem key={account.id} value={account.id}>
            {account.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
