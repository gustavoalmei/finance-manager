import type { SubmitEvent } from 'react'
import { useMutation } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { useFormFields } from '#/hooks/use-form-fields'
import { auth } from '#/lib/auth'
import { toaster } from '#/lib/toaster'
import { AuthActions } from './auth-actions'
import { AuthField } from './auth-field'
import { AuthLayout } from './auth-layout'

export const Register = () => {
  const navigate = useNavigate()
  const { values, field } = useFormFields({ name: '', email: '', password: '' })

  const registerMutation = useMutation({
    mutationFn: auth.register,
    onSuccess: () => {
      toaster.success('Conta criada com sucesso!')
      navigate({ to: '/login' })
    },
    onError: (error) => toaster.error(error),
  })

  const handleSubmit = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault()
    registerMutation.mutate(values)
  }

  return (
    <AuthLayout title="Cadastre-se" description="Crie uma conta para continuar" onSubmit={handleSubmit}>
      <AuthField
        {...field('name')}
        label="Nome"
        type="text"
        placeholder="Informe seu nome"
        autoComplete="name"
        required
      />
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
        autoComplete="new-password"
        required
      />

      <AuthActions
        submitLabel="Criar conta"
        isPending={registerMutation.isPending}
        altLabel="Já tenho uma conta"
        altTo="/login"
      />
    </AuthLayout>
  )
}
