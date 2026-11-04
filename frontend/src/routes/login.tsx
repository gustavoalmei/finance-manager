import { Login } from '#/components/auth/login'
import { getSessionUser } from '#/lib/auth/queries'
import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/login')({
  component: RouteComponent,
  ssr: false,
  beforeLoad: async ({ context }) => {
    const user = await getSessionUser(context.queryClient)

    if (user) {
      throw redirect({ to: '/' })
    }
  }
})


function RouteComponent() {
  return <Login />
}
