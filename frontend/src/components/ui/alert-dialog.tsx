import { AlertDialog as AlertDialogPrimitive } from "@base-ui/react/alert-dialog"

// Só o Root muda: role="alertdialog" e não fecha ao clicar fora.
// O conteúdo reaproveita as partes visuais do Dialog.
const AlertDialog = (props: AlertDialogPrimitive.Root.Props) => (
  <AlertDialogPrimitive.Root data-slot="alert-dialog" {...props} />
)

export { AlertDialog }
export {
  DialogClose as AlertDialogCancel,
  DialogContent as AlertDialogContent,
  DialogHeader as AlertDialogHeader,
  DialogFooter as AlertDialogFooter,
  DialogTitle as AlertDialogTitle,
  DialogDescription as AlertDialogDescription,
} from "./dialog"
