import type { SubmitEvent } from 'react'
import { useMutation } from '@tanstack/react-query'
import { useFormFields } from '#/hooks/use-form-fields'
import { auth } from '#/lib/auth'
import { toaster } from '#/lib/toaster'
import { AuthField } from './auth-field'
import { Button } from '../ui/button'

export const Register = ({ setTabSelected }: { setTabSelected: (tab: string) => void }) => {
  const { values, field } = useFormFields({ name: '', email: '', password: '' })

  const registerMutation = useMutation({
    mutationFn: auth.register,
    onSuccess: () => {
      toaster.success('Conta criada com sucesso!')
      setTabSelected('Entrar')
    },
    onError: (error) => toaster.error(error),
  })

  const handleSubmit = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault()
    registerMutation.mutate(values)
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
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

      <div className="flex flex-col gap-2.5 text-center">
        <Button type="submit" disabled={registerMutation.isPending} className={'h-12.5 cursor-pointer text-base font-bold rounded-xl'}>
          Criar conta
        </Button>

        <span>Já tem uma conta? <button type="button" onClick={() => setTabSelected('Entrar')} className="cursor-pointer font-bold underline">Entrar</button></span>
      </div>
    </form>
  )
}
