import { Eye, EyeOff } from 'lucide-react'
import { Button } from '#/components/ui/button'
import { useHideValues } from './hide-values-provider'

// Atalho do "Ocultar valores" (o mesmo da tela de Configurações)
export const HideValuesToggle = () => {
  const { hidden, setHidden } = useHideValues()

  return (
    <Button
      variant="ghost"
      size="icon"
      aria-pressed={hidden}
      aria-label={hidden ? 'Mostrar valores' : 'Ocultar valores'}
      title={hidden ? 'Mostrar valores' : 'Ocultar valores'}
      onClick={() => setHidden(!hidden)}
    >
      {hidden ? <EyeOff /> : <Eye />}
    </Button>
  )
}
