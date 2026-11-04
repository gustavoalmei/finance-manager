import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { auth } from '#/lib/auth'
import { toaster } from '#/lib/toaster'

export const useLogout = () => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const logoutMutation = useMutation({
    mutationFn: () => auth.logout(),
    onSuccess: () => {
      // limpa tudo: usuário em cache faria o /login redirecionar de volta,
      // e contas/cartões do usuário anterior não podem aparecer para o próximo
      queryClient.clear()
      navigate({ to: '/login' })
    },
    onError: (error) => toaster.error(error),
  })

  return () => logoutMutation.mutate()
}
