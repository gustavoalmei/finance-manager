import { useState } from 'react'
import type { SubmitEvent } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  AccountSelect,
  useDefaultAccountId,
} from '#/components/accounts/account-select'
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
import { FormField } from '#/components/ui/form-field'
import { Input } from '#/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#/components/ui/select'
import type { DialogRootProps } from '#/hooks/use-dialog-state'
import { useFormFields } from '#/hooks/use-form-fields'
import { cardBrandLabels, creditCards } from '#/lib/creditCard'
import type { CardBrand, CreditCard, CreditCardInput } from '#/lib/creditCard'
import { creditCardsQueryOptions } from '#/lib/creditCard/queries'
import { toaster } from '#/lib/toaster'
import { CreditCardVisual } from './credit-card-visual'

const brands = Object.entries(cardBrandLabels) as Array<[CardBrand, string]>

const texts = {
  create: {
    title: 'Novo cartão',
    description: 'Informe os dados do cartão de crédito.',
    submit: 'Criar cartão',
    pending: 'Criando...',
    success: 'Cartão criado!',
  },
  edit: {
    title: 'Editar cartão',
    description: 'Altere os dados do cartão e salve.',
    submit: 'Salvar',
    pending: 'Salvando...',
    success: 'Cartão atualizado!',
  },
}

type CreditCardFormProps = {
  card?: CreditCard
  onSuccess: () => void
}

// Montado só com o modal aberto: os campos começam sempre com os dados atuais
const CreditCardForm = ({ card, onSuccess }: CreditCardFormProps) => {
  const queryClient = useQueryClient()
  const text = card ? texts.edit : texts.create
  // novo cartão começa na conta do header
  const defaultAccountId = useDefaultAccountId()
  const [accountId, setAccountId] = useState(defaultAccountId)
  const [submitted, setSubmitted] = useState(false)
  const accountError =
    !card && !accountId ? 'Selecione a conta do cartão.' : undefined
  const { values, field, setValue } = useFormFields({
    name: card?.name ?? '',
    description: card?.description ?? '',
    brand: card?.brand ?? '',
    lastFourDigits: card?.lastFourDigits ?? '',
    // a API trabalha em centavos; o campo, em reais
    creditLimit: card ? (card.creditLimit / 100).toFixed(2) : '',
    closingDay: card ? String(card.closingDay) : '',
    dueDay: card ? String(card.dueDay) : '',
  })

  const saveMutation = useMutation({
    mutationFn: (input: CreditCardInput) =>
      card ? creditCards.update(card.id, input) : creditCards.create(input),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: creditCardsQueryOptions().queryKey,
      })
      toaster.success(text.success)
      onSuccess()
    },
    onError: (error) => toaster.error(error),
  })

  const handleSubmit = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSubmitted(true)
    if (accountError) return
    saveMutation.mutate({
      ...(!card && accountId && { accountId }),
      name: values.name,
      description: values.description || undefined,
      brand: values.brand as CardBrand,
      lastFourDigits: values.lastFourDigits,
      creditLimit: Math.round(Number(values.creditLimit) * 100),
      closingDay: Number(values.closingDay),
      dueDay: Number(values.dueDay),
    })
  }

  // prévia ao vivo: campo vazio ou inválido mantém o valor salvo
  const preview: CreditCard | null = card
    ? {
        ...card,
        name: values.name || card.name,
        brand: (values.brand || card.brand) as CardBrand,
        lastFourDigits: values.lastFourDigits || card.lastFourDigits,
        creditLimit: values.creditLimit
          ? Math.round(Number(values.creditLimit) * 100)
          : card.creditLimit,
        dueDay: Number(values.dueDay) || card.dueDay,
      }
    : null

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {preview && <CreditCardVisual card={preview} className="mx-auto" />}

      <FormField htmlFor="name" label="Nome">
        <Input
          {...field('name')}
          placeholder="Ex.: Nubank"
          required
          autoFocus
        />
      </FormField>

      {!card && (
        <FormField
          htmlFor="account"
          label="Conta"
          error={submitted ? accountError : undefined}
        >
          <AccountSelect
            id="account"
            value={accountId}
            onChange={setAccountId}
            invalid={submitted && Boolean(accountError)}
          />
        </FormField>
      )}

      <FormField htmlFor="description" label="Descrição (opcional)">
        <Input
          {...field('description')}
          maxLength={255}
          placeholder="Ex.: Cartão principal"
        />
      </FormField>

      <div className="grid grid-cols-2 gap-3">
        <FormField htmlFor="brand" label="Bandeira">
          {/* items: o Value mostra o rótulo ("Visa"), não o valor ("VISA") */}
          <Select
            name="brand"
            required
            items={cardBrandLabels}
            value={values.brand || null}
            onValueChange={(value) => setValue('brand', value ?? '')}
          >
            <SelectTrigger id="brand">
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent>
              {brands.map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormField>

        {/* só os 4 últimos: o número completo nem é pedido (PCI DSS) */}
        <FormField htmlFor="lastFourDigits" label="Últimos 4 dígitos">
          <Input
            {...field('lastFourDigits')}
            inputMode="numeric"
            pattern="\d{4}"
            maxLength={4}
            placeholder="1234"
            title="Informe os 4 últimos dígitos do cartão"
            autoComplete="off"
            required
          />
        </FormField>
      </div>

      <FormField htmlFor="creditLimit" label="Limite (R$)">
        <Input
          {...field('creditLimit')}
          type="number"
          min="0"
          step="0.01"
          inputMode="decimal"
          placeholder="0,00"
          required
        />
      </FormField>

      <div className="grid grid-cols-2 gap-3">
        <FormField htmlFor="closingDay" label="Dia do fechamento">
          <Input
            {...field('closingDay')}
            type="number"
            min="1"
            max="31"
            inputMode="numeric"
            placeholder="5"
            required
          />
        </FormField>
        <FormField htmlFor="dueDay" label="Dia do vencimento">
          <Input
            {...field('dueDay')}
            type="number"
            min="1"
            max="31"
            inputMode="numeric"
            placeholder="12"
            required
          />
        </FormField>
      </div>

      <DialogFooter>
        <DialogClose render={<Button type="button" variant="outline" />}>
          Cancelar
        </DialogClose>
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

type CreditCardFormDialogProps = DialogRootProps & {
  // sem cartão: criação · com cartão: edição
  card?: CreditCard | null
  onSuccess: () => void
}

export const CreditCardFormDialog = ({
  card,
  onSuccess,
  ...rootProps
}: CreditCardFormDialogProps) => {
  const text = card ? texts.edit : texts.create

  return (
    <Dialog {...rootProps}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{text.title}</DialogTitle>
          <DialogDescription>{text.description}</DialogDescription>
        </DialogHeader>

        <CreditCardForm card={card ?? undefined} onSuccess={onSuccess} />
      </DialogContent>
    </Dialog>
  )
}
