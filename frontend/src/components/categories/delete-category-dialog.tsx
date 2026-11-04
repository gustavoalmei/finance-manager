import { useMutation, useQueryClient } from '@tanstack/react-query'
import { ConfirmDeleteDialog } from '#/components/shared/confirm-delete-dialog'
import type { DialogRootProps } from '#/hooks/use-dialog-state'
import { categories } from '#/lib/categories'
import type { Category } from '#/lib/categories'
import { categoriesQueryOptions } from '#/lib/categories/queries'
import { toaster } from '#/lib/toaster'

type DeleteCategoryDialogProps = DialogRootProps & {
  category: Category | null
  onSuccess: () => void
}

export const DeleteCategoryDialog = ({
  category,
  onSuccess,
  ...rootProps
}: DeleteCategoryDialogProps) => {
  const queryClient = useQueryClient()

  const deleteMutation = useMutation({
    mutationFn: (id: string) => categories.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: categoriesQueryOptions().queryKey,
      })
      toaster.success('Categoria excluída!')
      onSuccess()
    },
    // ex.: 400 "existem transações vinculadas" vem do back e aparece no toast
    onError: (error) => toaster.error(error),
  })

  return (
    <ConfirmDeleteDialog
      {...rootProps}
      title={`Excluir a categoria ${category?.name ?? ''}?`}
      description="Essa ação não pode ser desfeita. Categorias com transações não podem ser excluídas."
      isPending={deleteMutation.isPending}
      onConfirm={() => category && deleteMutation.mutate(category.id)}
    />
  )
}
