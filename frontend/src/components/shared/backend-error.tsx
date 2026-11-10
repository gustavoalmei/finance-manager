import { ErrorComponent, useRouter } from '@tanstack/react-router'
import type { ErrorComponentProps } from '@tanstack/react-router'
import { ServerCrash } from 'lucide-react'
import { Button } from '#/components/ui/button'
import { BackendUnavailableError } from '#/lib/health'

// Só trata a falha de conexão; qualquer outro erro da rota segue para o componente padrão
export const BackendError = (props: ErrorComponentProps) => {
  const router = useRouter()

  if (!(props.error instanceof BackendUnavailableError)) return <ErrorComponent {...props} />

  return (
    <div
      role="alert"
      className="flex h-full w-full flex-col items-center justify-center gap-4 bg-background p-6 text-center text-foreground"
    >
      <ServerCrash className="size-12 text-muted-foreground" aria-hidden />
      <div className="flex flex-col gap-1">
        <h1 className="text-lg font-semibold">Estamos com problemas no servidor</h1>
        <p className="max-w-xs text-sm text-muted-foreground">
          Não conseguimos nos conectar no momento. Tente novamente em alguns instantes.
        </p>
      </div>
      <Button onClick={() => router.invalidate()}>Tentar novamente</Button>
    </div>
  )
}
