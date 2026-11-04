import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { BsPersonFill } from 'react-icons/bs'
import { EntityDropdown } from '#/components/shared/entity-dropdown'
import type {
  EntityDropdownLabels,
  EntityOption,
} from '#/components/shared/entity-dropdown'
import type { Account } from '#/lib/accounts'
import { accountsQueryOptions } from '#/lib/accounts/queries'
import { AccountFormDialog } from './account-form-dialog'

const labels: EntityDropdownLabels = {
  caption: 'Conta',
  placeholder: 'Selecione uma conta',
  list: 'Contas',
  amount: 'Saldo',
  empty: 'Nenhuma conta encontrada',
  create: 'Criar conta',
  manage: 'Gerenciar contas',
}

const toOption = (account: Account): EntityOption => ({
  id: account.id,
  label: account.name,
  description: account.type,
  amountInCents: account.accountBalance,
})

type AccountDropdownProps = {
  value: Account | null
  onChange: (account: Account) => void
  className?: string
}

export const AccountDropdown = ({
  value,
  onChange,
  className,
}: AccountDropdownProps) => {
  const { data: accounts = [] } = useQuery(accountsQueryOptions())
  const navigate = useNavigate()
  const [createOpen, setCreateOpen] = useState(false)

  return (
    <>
      <EntityDropdown
        items={accounts}
        value={value}
        onChange={onChange}
        toOption={toOption}
        icon={BsPersonFill}
        labels={labels}
        className={className}
        fnCreate={() => setCreateOpen(true)}
        fnManage={() => navigate({ to: '/accounts' })}
      />

      {/* fora do dropdown: o menu é desmontado ao clicar num item */}
      <AccountFormDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSuccess={() => setCreateOpen(false)}
      />
    </>
  )
}
