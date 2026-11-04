import { useState } from 'react'
import type { SubmitEvent } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Button } from '#/components/ui/button'
import { FormField } from '#/components/ui/form-field'
import { Input } from '#/components/ui/input'
import { PasswordInput } from '#/components/ui/password-input'
import { useFormFields } from '#/hooks/use-form-fields'
import type { SessionUser } from '#/lib/auth'
import { userQueryOptions } from '#/lib/auth/queries'
import { settings } from '#/lib/settings'
import type { ProfileInput } from '#/lib/settings'
import { toaster } from '#/lib/toaster'
import { SettingsSection } from './settings-section'

export const ProfileSection = ({ user }: { user: SessionUser }) => {
  const queryClient = useQueryClient()
  const { values, field, setValue } = useFormFields({
    name: user.name,
    email: user.email,
    emailConfirmation: '',
    currentPassword: '',
  })
  const [submitted, setSubmitted] = useState(false)

  const email = values.email.trim()
  // confirmação e senha só aparecem (e só são exigidas) quando o e-mail muda
  const emailChanged = email !== user.email
  const errors = {
    name: values.name.trim() ? undefined : 'Informe o nome.',
    emailConfirmation:
      !emailChanged || values.emailConfirmation.trim() === email
        ? undefined
        : 'Os e-mails não conferem.',
    currentPassword:
      !emailChanged || values.currentPassword
        ? undefined
        : 'Informe a senha atual para trocar o e-mail.',
  }
  const hasErrors = Object.values(errors).some(Boolean)
  const showError = (message: string | undefined) =>
    submitted ? message : undefined

  const saveMutation = useMutation({
    mutationFn: (input: ProfileInput) => settings.updateProfile(input),
    onSuccess: (updated) => {
      // o header e os outros lugares que leem o usuário atualizam na hora
      queryClient.setQueryData(userQueryOptions().queryKey, updated)
      setValue('emailConfirmation', '')
      setValue('currentPassword', '')
      setSubmitted(false)
      toaster.success('Perfil atualizado!')
    },
    onError: (error) => toaster.error(error),
  })

  const handleSubmit = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSubmitted(true)
    if (hasErrors) return
    saveMutation.mutate({
      name: values.name.trim(),
      email,
      emailConfirmation: emailChanged ? values.emailConfirmation.trim() : email,
      ...(emailChanged && { currentPassword: values.currentPassword }),
    })
  }

  return (
    <SettingsSection
      id="profile"
      title="Perfil"
      description="Seu nome e o e-mail usado para entrar."
    >
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
        <FormField htmlFor="name" label="Nome" error={showError(errors.name)}>
          <Input {...field('name')} autoComplete="name" maxLength={100} />
        </FormField>

        <FormField htmlFor="email" label="E-mail">
          <Input {...field('email')} type="email" autoComplete="email" />
        </FormField>

        {emailChanged && (
          <>
            <FormField
              htmlFor="emailConfirmation"
              label="Confirme o novo e-mail"
              hint="Digite de novo: o e-mail é o seu login."
              error={showError(errors.emailConfirmation)}
            >
              <Input
                {...field('emailConfirmation')}
                type="email"
                autoComplete="off"
                // colar faria a confirmação repetir um erro de digitação
                onPaste={(event) => event.preventDefault()}
              />
            </FormField>
            <FormField
              htmlFor="currentPassword"
              label="Senha atual"
              error={showError(errors.currentPassword)}
            >
              <PasswordInput
                {...field('currentPassword')}
                autoComplete="current-password"
              />
            </FormField>
          </>
        )}

        <Button
          type="submit"
          disabled={saveMutation.isPending}
          className="self-end bg-nav-active text-nav-active-foreground"
        >
          {saveMutation.isPending ? 'Salvando...' : 'Salvar perfil'}
        </Button>
      </form>
    </SettingsSection>
  )
}
