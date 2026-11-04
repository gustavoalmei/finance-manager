import { useState } from 'react'
import type { SubmitEvent } from 'react'
import { useMutation } from '@tanstack/react-query'
import { LogOut } from 'lucide-react'
import { Button } from '#/components/ui/button'
import { FormField } from '#/components/ui/form-field'
import { PasswordInput } from '#/components/ui/password-input'
import { Separator } from '#/components/ui/separator'
import { useFormFields } from '#/hooks/use-form-fields'
import { settings } from '#/lib/settings'
import type { PasswordInput as PasswordChange } from '#/lib/settings'
import { toaster } from '#/lib/toaster'
import { SettingsSection } from './settings-section'

const sessionsText = (count: number) =>
  count === 0
    ? 'Nenhuma outra sessão estava aberta.'
    : count === 1
      ? '1 outra sessão foi encerrada.'
      : `${count} outras sessões foram encerradas.`

const emptyPasswords = {
  currentPassword: '',
  newPassword: '',
  confirmation: '',
}

export const SecuritySection = () => {
  const { values, field, setValue } = useFormFields(emptyPasswords)
  const [submitted, setSubmitted] = useState(false)

  // as regras completas são conferidas no back (mesmas do cadastro)
  const errors = {
    currentPassword: values.currentPassword
      ? undefined
      : 'Informe a senha atual.',
    newPassword: values.newPassword ? undefined : 'Informe a nova senha.',
    confirmation:
      values.confirmation === values.newPassword
        ? undefined
        : 'As senhas não conferem.',
  }
  const hasErrors = Object.values(errors).some(Boolean)
  const showError = (message: string | undefined) =>
    submitted ? message : undefined

  const passwordMutation = useMutation({
    mutationFn: (input: PasswordChange) => settings.changePassword(input),
    onSuccess: ({ revokedSessions }) => {
      for (const key of Object.keys(emptyPasswords)) {
        setValue(key as keyof typeof emptyPasswords, '')
      }
      setSubmitted(false)
      toaster.success(`Senha alterada! ${sessionsText(revokedSessions)}`)
    },
    onError: (error) => toaster.error(error),
  })

  const revokeMutation = useMutation({
    mutationFn: () => settings.revokeOtherSessions(),
    onSuccess: ({ revokedSessions }) =>
      toaster.success(sessionsText(revokedSessions)),
    onError: (error) => toaster.error(error),
  })

  const handleSubmit = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSubmitted(true)
    if (hasErrors) return
    passwordMutation.mutate(values)
  }

  return (
    <SettingsSection
      id="security"
      title="Segurança"
      description="Senha de acesso e dispositivos conectados."
    >
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
        <FormField
          htmlFor="currentPassword-security"
          label="Senha atual"
          error={showError(errors.currentPassword)}
        >
          <PasswordInput
            {...field('currentPassword')}
            id="currentPassword-security"
            autoComplete="current-password"
          />
        </FormField>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            htmlFor="newPassword"
            label="Nova senha"
            hint="Mínimo 6 caracteres, com maiúscula, minúscula, número e símbolo."
            error={showError(errors.newPassword)}
          >
            <PasswordInput
              {...field('newPassword')}
              autoComplete="new-password"
            />
          </FormField>
          <FormField
            htmlFor="confirmation"
            label="Confirme a nova senha"
            error={showError(errors.confirmation)}
          >
            <PasswordInput
              {...field('confirmation')}
              autoComplete="new-password"
            />
          </FormField>
        </div>
        <p className="text-xs text-muted-foreground">
          Ao trocar a senha, os outros dispositivos conectados saem da conta.
        </p>
        <Button
          type="submit"
          disabled={passwordMutation.isPending}
          className="self-end bg-nav-active text-nav-active-foreground"
        >
          {passwordMutation.isPending ? 'Alterando...' : 'Alterar senha'}
        </Button>
      </form>

      <Separator />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium">Outros dispositivos</p>
          <p className="text-xs text-muted-foreground">
            Encerra a sessão em todos os lugares, menos neste.
          </p>
        </div>
        <Button
          variant="outline"
          disabled={revokeMutation.isPending}
          onClick={() => revokeMutation.mutate()}
        >
          <LogOut />
          {revokeMutation.isPending ? 'Encerrando...' : 'Sair dos outros'}
        </Button>
      </div>
    </SettingsSection>
  )
}
