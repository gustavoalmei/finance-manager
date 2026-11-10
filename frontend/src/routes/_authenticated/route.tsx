import { createFileRoute, redirect } from '@tanstack/react-router'
import { AuthenticatedLayout } from '#/components/layout/authenticated-layout'
import { AppLoading } from '#/components/shared/app-loading'
import { BackendError } from '#/components/shared/backend-error'
import { getSessionUser } from '#/lib/auth/queries'
import { pingBackend, waitForBackend } from '#/lib/health'

export const Route = createFileRoute('/_authenticated')({
  // Roda só no servidor. Backend acordado: SSR normal. Hibernando: o servidor
  // devolve só o pendingComponent e o cliente espera o backend no beforeLoad,
  // em vez de a página ficar em branco até ele acordar.
  ssr: async () => pingBackend(1_500),
  pendingComponent: AppLoading,
  errorComponent: BackendError,
  beforeLoad: async ({ context }) => {
    await waitForBackend()
    const user = await getSessionUser(context.queryClient)

    if (!user) {
      throw redirect({ to: '/auth' })
    }

    return { user }
  },
  component: AuthenticatedLayout,
})
