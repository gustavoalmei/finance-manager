import { useMutation, useQueryClient } from '@tanstack/react-query'
import { ConfirmDeleteDialog } from '#/components/shared/confirm-delete-dialog'
import type { DialogRootProps } from '#/hooks/use-dialog-state'
import { creditCards } from '#/lib/creditCard'
import type { CreditCard } from '#/lib/creditCard'
import { creditCardsQueryOptions } from '#/lib/creditCard/queries'
import { toaster } from '#/lib/toaster'

type DeleteCreditCardDialogProps = DialogRootProps & {
  card: CreditCard | null
  onSuccess: () => void
}

export const DeleteCreditCardDialog = ({
  card,
  onSuccess,
  ...rootProps
}: DeleteCreditCardDialogProps) => {
  const queryClient = useQueryClient()

  const deleteMutation = useMutation({
    mutationFn: (id: string) => creditCards.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: creditCardsQueryOptions().queryKey,
      })
      toaster.success('Cartão excluído!')
      onSuccess()
    },
    // ex.: 400 "Cartão possui transações." vem do back e aparece no toast
    onError: (error) => toaster.error(error),
  })

  return (
    <ConfirmDeleteDialog
      {...rootProps}
      title={`Excluir o cartão ${card?.name ?? ''}?`}
      description="Essa ação não pode ser desfeita. Cartões com transações não podem ser excluídos."
      isPending={deleteMutation.isPending}
      onConfirm={() => card && deleteMutation.mutate(card.id)}
    />
  )
}
