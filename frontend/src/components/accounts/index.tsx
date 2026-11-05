import type { ReactNode } from 'react'
import { useQuery } from '@tanstack/react-query'
import { RowActions } from '#/components/shared/row-actions'
import { TableCustom } from '#/components/ui/table'
import type { TableColumn } from '#/components/ui/table'
import { useDialogState } from '#/hooks/use-dialog-state'
import type { Account } from '#/lib/accounts'
import { accountsQueryOptions } from '#/lib/accounts/queries'
import { formatCurrency } from '#/lib/format'
import { DeleteAccountDialog } from './delete-account-dialog'
import { AccountFormDialog } from './account-form-dialog'
import { CreateAccountButton } from './create-account-button'

type AccountRow = {
  id: string
  name: string
  type: string
  balance: ReactNode
  actions: ReactNode
}

const columns: Array<TableColumn<AccountRow>> = [
  { label: 'Nome', value: 'name' },
  { label: 'Tipo', value: 'type' },
  { label: 'Saldo', value: 'balance' },
  { label: 'Ações', value: 'actions' },
]

export const Accounts = () => {
  const { data: accountList = [], isPending } = useQuery(accountsQueryOptions())
  const editDialog = useDialogState<Account>()
  const deleteDialog = useDialogState<Account>()

  const toRow = (account: Account): AccountRow => ({
    id: account.id,
    name: account.name,
    type: account.type,
    balance: (
      <span className="sensitive">
        {formatCurrency(account.accountBalance / 100)}
      </span>
    ),
    actions: (
      <RowActions
        label={`conta ${account.name}`}
        onEdit={() => editDialog.show(account)}
        onDelete={() => deleteDialog.show(account)}
      />
    ),
  })

  return (
    <div className="flex flex-col gap-4">
      <div className="flex sm:items-center justify-between gap-2 sm:flex-row flex-col">
        <h1 className="text-xl font-bold">Contas</h1>
        <CreateAccountButton />
      </div>

      <TableCustom
        label=""
        columns={columns}
        items={accountList.map(toRow)}
        isLoading={isPending}
        getRowKey={(row) => row.id}
        searchable
        searchPlaceholder="Buscar conta..."
        emptyState={{
          title: 'Nenhuma conta cadastrada',
          description: 'Crie a primeira conta para começar a registrar seus lançamentos.',
          action: <CreateAccountButton />,
        }}
      />

      <AccountFormDialog
        {...editDialog.rootProps}
        account={editDialog.target}
        onSuccess={editDialog.close}
      />
      <DeleteAccountDialog
        {...deleteDialog.rootProps}
        account={deleteDialog.target}
        onSuccess={deleteDialog.close}
      />
    </div>
  )
}
