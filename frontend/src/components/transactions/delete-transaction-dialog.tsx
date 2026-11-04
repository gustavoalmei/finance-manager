import { useMutation, useQueryClient } from '@tanstack/react-query'
import { ConfirmDeleteDialog } from '#/components/shared/confirm-delete-dialog'
import type { DialogRootProps } from '#/hooks/use-dialog-state'
import { transactions } from '#/lib/transactions'
import type { Transaction } from '#/lib/transactions'
import { toaster } from '#/lib/toaster'

type DeleteTransactionDialogProps = DialogRootProps & {
  transaction: Transaction | null
  onSuccess: () => void
}

export const DeleteTransactionDialog = ({
  transaction,
  onSuccess,
  ...rootProps
}: DeleteTransactionDialogProps) => {
  const queryClient = useQueryClient()

  const deleteMutation = useMutation({
    mutationFn: (id: string) => transactions.remove(id),
    onSuccess: () => {
      // todos os períodos: a transação pode aparecer em mais de um filtro
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
      // saldo da conta e limite do cartão mudam junto
      queryClient.invalidateQueries({ queryKey: ['accounts'] })
      queryClient.invalidateQueries({ queryKey: ['credit-cards'] })
      toaster.success('Transação excluída!')
      onSuccess()
    },
    onError: (error) => toaster.error(error),
  })

  return (
    <ConfirmDeleteDialog
      {...rootProps}
      title={`Excluir a transação ${transaction?.description ?? ''}?`}
      description="Essa ação não pode ser desfeita."
      isPending={deleteMutation.isPending}
      onConfirm={() => transaction && deleteMutation.mutate(transaction.id)}
    />
  )
}
