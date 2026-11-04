import { createFileRoute, redirect } from '@tanstack/react-router'
import { AuthenticatedLayout } from '#/components/layout/authenticated-layout'
import { getSessionUser } from '#/lib/auth/queries'

export const Route = createFileRoute('/_authenticated')({
  beforeLoad: async ({ context }) => {
    const user = await getSessionUser(context.queryClient)

    if (!user) {
      throw redirect({ to: '/login' })
    }

    return { user }
  },
  component: AuthenticatedLayout,
})
