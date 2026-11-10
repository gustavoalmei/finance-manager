import { useEffect, useState } from 'react'
import { LoaderCircle } from 'lucide-react'
import { Logo } from '#/components/icons/logo'

const SLOW_HINT_DELAY_MS = 3_000

export const AppLoading = () => {
  const [isSlow, setIsSlow] = useState(false)

  useEffect(() => {
    const id = setTimeout(() => setIsSlow(true), SLOW_HINT_DELAY_MS)
    return () => clearTimeout(id)
  }, [])

  return (
    <div
      role="status"
      aria-live="polite"
      className="flex h-full w-full flex-col items-center justify-center gap-4 bg-background p-6 text-center text-foreground"
    >
      <Logo className="h-16 w-auto" />
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <LoaderCircle className="size-4 animate-spin" aria-hidden />
        Conectando ao servidor...
      </div>
      {isSlow && (
        <p className="max-w-xs text-xs text-muted-foreground">
          O servidor estava em repouso e pode levar até um minuto para iniciar.
        </p>
      )}
    </div>
  )
}
