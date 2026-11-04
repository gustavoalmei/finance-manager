import { Pencil, Trash2 } from 'lucide-react'
import { Button } from '#/components/ui/button'

type RowActionsProps = {
  // descreve o item para o leitor de tela (ex.: "conta Corrente")
  label: string
  // sem onEdit, o botão de editar não aparece
  onEdit?: () => void
  onDelete: () => void
}

// Ações discretas: numa tabela, botões chamativos em toda linha viram ruído visual
export const RowActions = ({ label, onEdit, onDelete }: RowActionsProps) => (
  <div className="flex items-center justify-end gap-1">
    {onEdit && (
      <Button
        variant="ghost"
        size="icon"
        aria-label={`Editar ${label}`}
        title="Editar"
        className="cursor-pointer text-muted-foreground"
        onClick={onEdit}
      >
        <Pencil />
      </Button>
    )}
    <Button
      variant="ghost"
      size="icon"
      aria-label={`Excluir ${label}`}
      title="Excluir"
      className="cursor-pointer text-muted-foreground hover:bg-destructive-soft hover:text-destructive-text focus-visible:ring-destructive/40"
      onClick={onDelete}
    >
      <Trash2 />
    </Button>
  </div>
)
