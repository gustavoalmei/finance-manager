import { useMutation, useQueryClient } from '@tanstack/react-query'
import { ConfirmDeleteDialog } from '#/components/shared/confirm-delete-dialog'
import type { DialogRootProps } from '#/hooks/use-dialog-state'
import { accounts } from '#/lib/accounts'
import type { Account } from '#/lib/accounts'
import { accountsQueryOptions } from '#/lib/accounts/queries'
import { toaster } from '#/lib/toaster'

type DeleteAccountDialogProps = DialogRootProps & {
  account: Account | null
  onSuccess: () => void
}

export const DeleteAccountDialog = ({
  account,
  onSuccess,
  ...rootProps
}: DeleteAccountDialogProps) => {
  const queryClient = useQueryClient()

  const deleteMutation = useMutation({
    mutationFn: (id: string) => accounts.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: accountsQueryOptions().queryKey,
      })
      toaster.success('Conta excluída!')
      onSuccess()
    },
    onError: (error) => toaster.error(error),
  })

  return (
    <ConfirmDeleteDialog
      {...rootProps}
      title={`Excluir a conta ${account?.name ?? ''}?`}
      isPending={deleteMutation.isPending}
      onConfirm={() => account && deleteMutation.mutate(account.id)}
    />
  )
}
