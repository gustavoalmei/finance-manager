import { Auth } from '#/components/auth'
import { AppLoading } from '#/components/shared/app-loading'
import { BackendError } from '#/components/shared/backend-error'
import { getSessionUser } from '#/lib/auth/queries'
import { waitForBackend } from '#/lib/health'
import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/auth')({
  component: RouteComponent,
  ssr: false,
  pendingComponent: AppLoading,
  errorComponent: BackendError,
  beforeLoad: async ({ context }) => {
    await waitForBackend()
    const user = await getSessionUser(context.queryClient)

    if (user) {
      throw redirect({ to: '/' })
    }
  }
})


function RouteComponent() {
  return <Auth />
}
