import { useState } from 'react'

export type DialogRootProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

// Modal ligado a um item (ex.: conta sendo editada)
export const useDialogState = <T>() => {
  const [target, setTarget] = useState<T | null>(null)
  const [open, setOpen] = useState(false)

  return {
    // não é limpo ao fechar: o conteúdo continua visível durante a animação de saída
    target,
    show: (item: T) => {
      setTarget(item)
      setOpen(true)
    },
    close: () => setOpen(false),
    rootProps: { open, onOpenChange: setOpen } satisfies DialogRootProps,
  }
}
