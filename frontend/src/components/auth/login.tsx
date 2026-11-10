import type { SubmitEvent } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { useFormFields } from '#/hooks/use-form-fields'
import { auth } from '#/lib/auth'
import { userQueryOptions } from '#/lib/auth/queries'
import { toaster } from '#/lib/toaster'
import { AuthField } from './auth-field'
import { Button } from '../ui/button'

export const Login = ({ setTabSelected }: { setTabSelected: (tab: string) => void }) => {
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
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
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

      <div className="flex flex-col gap-2.5 text-center">
        <Button type="submit" disabled={loginMutation.isPending} className={'h-12.5 cursor-pointer text-base font-bold rounded-xl'}>
          Entrar
        </Button>

        <span>Ainda não tem uma conta? <button type="button" onClick={() => setTabSelected('Registrar')} className="cursor-pointer font-bold underline">Cadastre-se</button></span>
      </div>
    </form>
  )
}
