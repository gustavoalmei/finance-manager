import type { SubmitEvent } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { useFormFields } from '#/hooks/use-form-fields'
import { auth } from '#/lib/auth'
import { userQueryOptions } from '#/lib/auth/queries'
import { toaster } from '#/lib/toaster'
import { AuthActions } from './auth-actions'
import { AuthField } from './auth-field'
import { AuthLayout } from './auth-layout'

export const Login = () => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { values, field } = useFormFields({ email: '', password: '' })

  const loginMutation = useMutation({
    mutationFn: auth.login,
    onSuccess: () => {
      // descarta o "sem usuário" em cache: o beforeLoad busca o usuário logado
      queryClient.removeQueries({ queryKey: userQueryOptions().queryKey })
      toaster.success('Logado com sucesso!')
      navigate({ to: '/' })
    },
    onError: (error) => toaster.error(error),
  })

  const handleSubmit = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault()
    loginMutation.mutate(values)
  }

  return (
    <AuthLayout title="Bem vindo" description="Faça login para continuar" onSubmit={handleSubmit}>
      <AuthField
        {...field('email')}
        label="Email"
        type="email"
        placeholder="Informe seu email"
        autoComplete="email"
        required
      />
      <AuthField
        {...field('password')}
        label="Senha"
        type="password"
        placeholder="Informe sua senha"
        autoComplete="current-password"
        required
      />

      <AuthActions
        submitLabel="Entrar"
        isPending={loginMutation.isPending}
        altLabel="Cadastrar"
        altTo="/register"
      />
    </AuthLayout>
  )
}
