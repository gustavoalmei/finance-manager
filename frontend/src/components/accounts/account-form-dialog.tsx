import type { SubmitEvent } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Button } from '#/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '#/components/ui/dialog'
import { Input } from '#/components/ui/input'
import { Label } from '#/components/ui/label'
import type { DialogRootProps } from '#/hooks/use-dialog-state'
import { useFormFields } from '#/hooks/use-form-fields'
import { accounts } from '#/lib/accounts'
import type { Account, AccountInput } from '#/lib/accounts'
import { accountsQueryOptions } from '#/lib/accounts/queries'
import { toaster } from '#/lib/toaster'

const texts = {
  create: {
    title: 'Nova conta',
    description: 'Informe os dados da nova conta.',
    submit: 'Criar conta',
    pending: 'Criando...',
    success: 'Conta criada!',
  },
  edit: {
    title: 'Editar conta',
    description: 'Altere os dados da conta e salve.',
    submit: 'Salvar',
    pending: 'Salvando...',
    success: 'Conta atualizada!',
  },
}

type AccountFormProps = {
  account?: Account
  onSuccess: () => void
}

// Montado só com o modal aberto: os campos começam sempre com os dados atuais
const AccountForm = ({ account, onSuccess }: AccountFormProps) => {
  const queryClient = useQueryClient()
  const text = account ? texts.edit : texts.create
  const { values, field } = useFormFields({
    name: account?.name ?? '',
    type: account?.type ?? '',
    // a API trabalha em centavos; o campo, em reais
    balance: account ? (account.accountBalance / 100).toFixed(2) : '',
  })

  const saveMutation = useMutation({
    mutationFn: (input: AccountInput) =>
      account ? accounts.update(account.id, input) : accounts.create(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: accountsQueryOptions().queryKey })
      toaster.success(text.success)
      onSuccess()
    },
    onError: (error) => toaster.error(error),
  })

  const handleSubmit = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault()
    saveMutation.mutate({
      name: values.name,
      type: values.type,
      accountBalance: Math.round(Number(values.balance) * 100),
    })
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="name">Nome</Label>
        <Input {...field('name')} name="name" placeholder="Ex.: Nubank" required autoFocus />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="type">Tipo</Label>
        <Input {...field('type')} name="type" placeholder="Ex.: Conta corrente" required />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="balance">Saldo (R$)</Label>
        <Input
          {...field('balance')}
          name="balance"
          type="number"
          step="0.01"
          inputMode="decimal"
          placeholder="0,00"
          required
        />
      </div>

      <DialogFooter>
        <DialogClose render={<Button type="button" variant="outline" />}>Cancelar</DialogClose>
        <Button
          type="submit"
          disabled={saveMutation.isPending}
          className="bg-nav-active text-nav-active-foreground"
        >
          {saveMutation.isPending ? text.pending : text.submit}
        </Button>
      </DialogFooter>
    </form>
  )
}

type AccountFormDialogProps = DialogRootProps & {
  // sem conta: criação · com conta: edição
  account?: Account | null
  onSuccess: () => void
}

export const AccountFormDialog = ({ account, onSuccess, ...rootProps }: AccountFormDialogProps) => {
  const text = account ? texts.edit : texts.create

  return (
    <Dialog {...rootProps}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{text.title}</DialogTitle>
          <DialogDescription>{text.description}</DialogDescription>
        </DialogHeader>

        <AccountForm account={account ?? undefined} onSuccess={onSuccess} />
      </DialogContent>
    </Dialog>
  )
}
