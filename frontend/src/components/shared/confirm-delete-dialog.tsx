import { Button } from '#/components/ui/button'
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '#/components/ui/alert-dialog'
import type { DialogRootProps } from '#/hooks/use-dialog-state'

type ConfirmDeleteDialogProps = DialogRootProps & {
  title: string
  description?: string
  isPending: boolean
  onConfirm: () => void
}

// Confirmação de exclusão: AlertDialog não fecha com clique fora
export const ConfirmDeleteDialog = ({
  title,
  description = 'Essa ação não pode ser desfeita.',
  isPending,
  onConfirm,
  ...rootProps
}: ConfirmDeleteDialogProps) => (
  <AlertDialog {...rootProps}>
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>{title}</AlertDialogTitle>
        <AlertDialogDescription>{description}</AlertDialogDescription>
      </AlertDialogHeader>

      <AlertDialogFooter>
        {/* foco inicial no Cancelar: Enter acidental não exclui */}
        <AlertDialogCancel render={<Button variant="outline" autoFocus />}>
          Cancelar
        </AlertDialogCancel>
        <Button variant="destructive" disabled={isPending} onClick={onConfirm}>
          {isPending ? 'Excluindo...' : 'Excluir'}
        </Button>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
)
