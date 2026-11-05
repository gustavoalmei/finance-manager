import { useState } from 'react'
import type { ReactNode, SubmitEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  ArrowLeftRight,
  CreditCard as CardIcon,
  Minus,
  Plus,
  X,
} from 'lucide-react'
import {
  AccountSelect,
  useDefaultAccountId,
} from '#/components/accounts/account-select'
import { useAccountSelection } from '#/components/accounts/account-selection-context'
import { DatePicker } from '#/components/shared/date-picker'
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
import { Switch } from '#/components/ui/switch'
import type { DialogRootProps } from '#/hooks/use-dialog-state'
import { categoriesQueryOptions } from '#/lib/categories/queries'
import { maskCardNumber } from '#/lib/creditCard'
import { creditCardsQueryOptions } from '#/lib/creditCard/queries'
import { formatCurrency } from '#/lib/format'
import { toaster } from '#/lib/toaster'
import {
  dayToISO,
  isoToDay,
  transactionStatusLabels,
  transactions,
} from '#/lib/transactions'
import type {
  Transaction,
  TransactionInput,
  TransactionStatus,
} from '#/lib/transactions'
import { cn } from '#/lib/utils'

type FormType = TransactionInput['type']

const MAX_INSTALLMENTS = 48

const typeOptions: Array<[FormType, string]> = [
  ['EXPENSE', 'Despesa'],
  ['INCOME', 'Receita'],
]

// o texto do status acompanha a direção do dinheiro
const statusOptions: Record<FormType, Array<[TransactionStatus, string]>> = {
  EXPENSE: [
    ['PENDING', 'A pagar'],
    ['CONFIRMED', 'Pago'],
    ['CANCELLED', transactionStatusLabels.CANCELLED],
  ],
  INCOME: [
    ['PENDING', 'A receber'],
    ['CONFIRMED', 'Recebido'],
    ['CANCELLED', transactionStatusLabels.CANCELLED],
  ],
}

const submitLabels: Record<FormType, string> = {
  EXPENSE: 'Salvar despesa',
  INCOME: 'Salvar receita',
}

const today = () => {
  const now = new Date()
  return new Date(now.getFullYear(), now.getMonth(), now.getDate())
}

const addMonths = (day: Date, months: number) =>
  new Date(day.getFullYear(), day.getMonth() + months, day.getDate())

// "out/2026"
const formatMonth = (day: Date) =>
  `${day.toLocaleString('pt-BR', { month: 'short' }).replace('.', '')}/${day.getFullYear()}`

// só dígitos, lidos como centavos: digitar "30000" mostra R$ 300,00
const parseCents = (text: string) =>
  Number(text.replace(/\D/g, '').slice(0, 12))

type ToggleOptionsProps<T extends string> = {
  label: string
  value: T
  options: Array<[T, string]>
  onChange: (value: T) => void
  disabled?: boolean
  className?: string
  optionClassName?: (selected: boolean) => string
}

// Botões com aria-pressed: o leitor de tela anuncia qual está ativo
const ToggleOptions = <T extends string>({
  label,
  value,
  options,
  onChange,
  disabled,
  className,
  optionClassName,
}: ToggleOptionsProps<T>) => (
  <div role="group" aria-label={label} className={className}>
    {options.map(([option, text]) => (
      <Button
        key={option}
        type="button"
        variant="outline"
        aria-pressed={value === option}
        disabled={disabled}
        onClick={() => onChange(option)}
        className={cn('cursor-pointer', optionClassName?.(value === option))}
      >
        {text}
      </Button>
    ))}
  </div>
)

type StepperProps = {
  id: string
  label: string
  value: number
  min: number
  max: number
  onChange: (value: number) => void
  disabled?: boolean
}

// Campo numérico com − e +: evita digitar parcela fora do intervalo
const Stepper = ({
  id,
  label,
  value,
  min,
  max,
  onChange,
  disabled,
}: StepperProps) => (
  <div className="flex flex-col gap-1.5">
    <span id={id} className="text-sm font-medium">
      {label}
    </span>
    <div
      role="group"
      aria-labelledby={id}
      className="flex h-10 items-center rounded-lg border border-input bg-card"
    >
      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label={`Diminuir ${label.toLowerCase()}`}
        disabled={disabled || value <= min}
        onClick={() => onChange(value - 1)}
        className="size-10 cursor-pointer"
      >
        <Minus />
      </Button>
      <output
        aria-live="polite"
        className="flex-1 text-center text-sm tabular-nums"
      >
        {value}
      </output>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label={`Aumentar ${label.toLowerCase()}`}
        disabled={disabled || value >= max}
        onClick={() => onChange(value + 1)}
        className="size-10 cursor-pointer"
      >
        <Plus />
      </Button>
    </div>
  </div>
)

type TransactionFormProps = {
  transaction?: Transaction
  onSuccess: () => void
}

// Montado só com o modal aberto: os campos começam sempre com os dados atuais
const TransactionForm = ({ transaction, onSuccess }: TransactionFormProps) => {
  const queryClient = useQueryClient()
  const { selectedCard } = useAccountSelection()
  const { data: categories = [] } = useQuery(categoriesQueryOptions())
  const { data: cards = [] } = useQuery(creditCardsQueryOptions())
  const defaultAccountId = useDefaultAccountId()

  const isEdit = Boolean(transaction)
  // o PUT não troca cartão nem parcelas: na edição esses campos só informam
  const lockCard = isEdit

  const [type, setType] = useState<FormType>(
    transaction?.type === 'INCOME' ? 'INCOME' : 'EXPENSE',
  )
  // centavos. Na criação com cartão é sempre o total da compra (mesmo já
  // começada); na edição, o da parcela
  const [amount, setAmount] = useState(transaction?.amount ?? 0)
  const [description, setDescription] = useState(transaction?.description ?? '')
  const [categoryId, setCategoryId] = useState(transaction?.categoryId ?? null)
  // nova transação começa na conta do header
  const [accountId, setAccountId] = useState(
    transaction?.accountId ?? defaultAccountId,
  )
  const [date, setDate] = useState(() =>
    transaction ? isoToDay(transaction.date) : today(),
  )
  const [status, setStatus] = useState<TransactionStatus>(
    transaction?.status ?? 'CONFIRMED',
  )
  // nova despesa já vem no cartão escolhido no header
  const [useCard, setUseCard] = useState(
    transaction ? Boolean(transaction.cardId) : Boolean(selectedCard),
  )
  const [cardId, setCardId] = useState(
    transaction?.cardId ?? selectedCard?.id ?? null,
  )
  const [installments, setInstallments] = useState(
    transaction?.totalInstallments ?? 1,
  )
  // compra que já começou (ex.: 4 de 10): só na criação
  const [currentInstallment, setCurrentInstallment] = useState(1)
  const [isRecurring, setIsRecurring] = useState(
    transaction?.isRecurring ?? false,
  )
  // erros só aparecem depois da 1ª tentativa de salvar
  const [submitted, setSubmitted] = useState(false)

  const payWithCard = type === 'EXPENSE' && useCard
  const isInstallment = payWithCard && installments > 1
  // diminuir o total não pode deixar a parcela atual maior que ele
  const startInstallment = Math.min(currentInstallment, installments)
  // já começou: Data é a da parcela atual; as anteriores foram cobradas antes
  // e não são criadas
  const isStarted = isInstallment && !isEdit && startInstallment > 1
  const remainingInstallments = installments - startInstallment + 1
  const installmentAmount =
    payWithCard && !isEdit
      ? Math.round(amount / installments)
      : amount

  const errors = {
    amount: amount > 0 ? undefined : 'Informe um valor maior que zero.',
    description: description.trim() ? undefined : 'Informe uma descrição.',
    category: categoryId ? undefined : 'Selecione uma categoria.',
    account: payWithCard || accountId ? undefined : 'Selecione a conta.',
    card: !payWithCard || cardId ? undefined : 'Selecione o cartão.',
  }
  const hasErrors = Object.values(errors).some(Boolean)
  const showError = (message: string | undefined) =>
    submitted ? message : undefined

  const categoryItems = Object.fromEntries(
    categories.map((category) => [category.id, category.name]),
  )
  const cardItems: Record<string, ReactNode> = Object.fromEntries(
    cards.map((card) => [
      card.id,
      [card.name, maskCardNumber(card.lastFourDigits)]
        .filter(Boolean)
        .join(' '),
    ]),
  )

  const saveMutation = useMutation({
    mutationFn: (input: TransactionInput) =>
      transaction
        ? transactions.update(transaction.id, input)
        : transactions.create(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
      // limite usado do cartão e saldo da conta mudam junto
      queryClient.invalidateQueries({
        queryKey: creditCardsQueryOptions().queryKey,
      })
      queryClient.invalidateQueries({ queryKey: ['accounts'] })
      toaster.success(isEdit ? 'Transação atualizada!' : 'Transação criada!')
      onSuccess()
    },
    onError: (error) => toaster.error(error),
  })

  const handleSubmit = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSubmitted(true)
    if (hasErrors || !categoryId) return

    // parcelas existentes mantêm a numeração no PUT
    const installmentFields = transaction
      ? transaction.totalInstallments
        ? {
            installmentNumber: transaction.installmentNumber ?? undefined,
            totalInstallments: transaction.totalInstallments,
          }
        : {}
      : payWithCard && cardId
        ? {
            cardId,
            installmentNumber: startInstallment,
            totalInstallments: installments,
          }
        : {}

    saveMutation.mutate({
      // no cartão o back usa a conta do cartão
      ...(!payWithCard && accountId && { accountId }),
      categoryId,
      type,
      status,
      amount: installmentAmount,
      description: description.trim(),
      date: dayToISO(date),
      isRecurring: !isInstallment && isRecurring,
      ...installmentFields,
    })
  }

  const installmentHint = () => {
    if (isEdit && transaction?.totalInstallments) {
      return `Parcela ${transaction.installmentNumber} de ${transaction.totalInstallments}. Cartão e parcelas não podem ser alterados.`
    }
    if (installments === 1) return 'Pagamento à vista, na fatura do cartão'
    if (isStarted) {
      return `Parcelas ${startInstallment} a ${installments} · ${remainingInstallments}x de ${formatCurrency(installmentAmount / 100)}, de ${formatMonth(date)} a ${formatMonth(addMonths(date, remainingInstallments - 1))}. As anteriores já foram cobradas e não entram.`
    }
    return `${installments}x de ${formatCurrency(installmentAmount / 100)} · uma parcela por mês, de ${formatMonth(date)} a ${formatMonth(addMonths(date, installments - 1))}`
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
      <ToggleOptions
        label="Tipo de transação"
        value={type}
        options={typeOptions}
        onChange={setType}
        // trocar o tipo de uma compra no cartão quebraria a fatura
        disabled={Boolean(transaction?.cardId)}
        className="grid grid-cols-2 gap-1 rounded-xl bg-item p-1"
        optionClassName={(selected) =>
          cn(
            'h-9 border-0',
            selected
              ? 'bg-nav-active text-nav-active-foreground hover:bg-nav-active'
              : 'bg-transparent text-muted-foreground',
          )
        }
      />

      <FormField
        htmlFor="amount"
        label={
          isEdit && transaction?.totalInstallments
            ? 'Valor da parcela'
            : isInstallment
              ? 'Valor total da compra'
              : 'Valor'
        }
        error={showError(errors.amount)}
      >
        <Input
          id="amount"
          inputMode="numeric"
          autoComplete="off"
          value={formatCurrency(amount / 100)}
          onChange={(event) => setAmount(parseCents(event.target.value))}
          aria-invalid={Boolean(showError(errors.amount))}
          autoFocus
        />
      </FormField>

      <FormField
        htmlFor="description"
        label="Descrição"
        error={showError(errors.description)}
      >
        <Input
          id="description"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          maxLength={255}
          placeholder="Ex.: Mercado do mês"
          aria-invalid={Boolean(showError(errors.description))}
        />
      </FormField>

      <div className="grid grid-cols-2 gap-3">
        <FormField
          htmlFor="category"
          label="Categoria"
          error={showError(errors.category)}
        >
          <Select
            items={categoryItems}
            value={categoryId}
            onValueChange={setCategoryId}
          >
            <SelectTrigger
              id="category"
              aria-invalid={Boolean(showError(errors.category))}
            >
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormField>

        <FormField
          htmlFor="date"
          label={
            isStarted
              ? 'Data da parcela atual'
              : isInstallment
                ? 'Data da 1ª parcela'
                : 'Data'
          }
        >
          <DatePicker id="date" value={date} onChange={setDate} />
        </FormField>
      </div>

      {!payWithCard && (
        <FormField
          htmlFor="account"
          label="Conta"
          error={showError(errors.account)}
        >
          <AccountSelect
            id="account"
            value={accountId}
            onChange={setAccountId}
            invalid={Boolean(showError(errors.account))}
          />
        </FormField>
      )}

      <ToggleOptions
        label="Status"
        value={status}
        options={statusOptions[type]}
        onChange={setStatus}
        className="flex gap-3"
        optionClassName={(selected) =>
          cn('rounded-xl', selected && 'border-ring bg-muted')
        }
      />

      {type === 'EXPENSE' && (
        <section className="flex flex-col gap-4 rounded-xl bg-item p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex flex-col gap-0.5">
              <label htmlFor="use-card" className="text-sm font-medium">
                Pagar com cartão de crédito
              </label>
              <small className="text-[11px] text-muted-foreground">
                A compra entra na fatura do cartão
              </small>
            </div>
            <Switch
              id="use-card"
              checked={useCard}
              onCheckedChange={setUseCard}
              disabled={lockCard}
            />
          </div>

          {useCard && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <FormField
                  htmlFor="card"
                  label="Cartão"
                  error={showError(errors.card)}
                >
                  <Select
                    items={cardItems}
                    value={cardId}
                    onValueChange={setCardId}
                    disabled={lockCard}
                  >
                    <SelectTrigger
                      id="card"
                      className="bg-card"
                      aria-invalid={Boolean(showError(errors.card))}
                    >
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {cards.map((card) => (
                        <SelectItem key={card.id} value={card.id}>
                          {cardItems[card.id]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormField>

                <Stepper
                  id="installments-label"
                  label="Parcelas"
                  value={installments}
                  min={1}
                  max={MAX_INSTALLMENTS}
                  onChange={setInstallments}
                  disabled={lockCard}
                />
              </div>

              {/* a fatura em que cada parcela cai sai da data: a atual cai na fatura de hoje */}
              {isInstallment && !isEdit && (
                <div className="grid grid-cols-2 items-end gap-3">
                  <Stepper
                    id="current-installment-label"
                    label="Parcela atual"
                    value={startInstallment}
                    min={1}
                    max={installments}
                    onChange={setCurrentInstallment}
                  />
                  <small className="pb-2 text-[11px] text-muted-foreground">
                    Compra que já começou? Informe em qual parcela ela está
                    (ex.: 4 de 10).
                  </small>
                </div>
              )}

              <small className="flex items-center gap-2 text-[11px] text-muted-foreground">
                <CardIcon className="size-4 shrink-0" aria-hidden="true" />
                {installmentHint()}
              </small>
            </>
          )}
        </section>
      )}

      <section className="flex items-start justify-between gap-4 rounded-xl bg-item p-4">
        <div className="flex flex-col gap-0.5">
          <label htmlFor="recurring" className="text-sm font-medium">
            Repetir todo mês
          </label>
          <small className="text-[11px] text-muted-foreground">
            {isInstallment
              ? 'Indisponível para compras parceladas'
              : 'Lança de novo no mesmo dia, todo mês'}
          </small>
        </div>
        <Switch
          id="recurring"
          checked={!isInstallment && isRecurring}
          onCheckedChange={setIsRecurring}
          disabled={isInstallment}
        />
      </section>

      <DialogFooter>
        <DialogClose render={<Button type="button" variant="outline" />}>
          Cancelar
        </DialogClose>
        <Button
          type="submit"
          disabled={saveMutation.isPending}
          className="bg-nav-active text-nav-active-foreground"
        >
          {saveMutation.isPending ? 'Salvando...' : submitLabels[type]}
        </Button>
      </DialogFooter>
    </form>
  )
}

type TransactionFormDialogProps = DialogRootProps & {
  // sem transação: criação · com transação: edição
  transaction?: Transaction | null
  onSuccess: () => void
}

export const TransactionFormDialog = ({
  transaction,
  onSuccess,
  ...rootProps
}: TransactionFormDialogProps) => (
  <Dialog {...rootProps}>
    <DialogContent className="md:max-w-lg">
      <DialogHeader className="flex-row items-center gap-3">
        <span
          aria-hidden="true"
          className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-brand text-brand-foreground"
        >
          <ArrowLeftRight className="size-4" />
        </span>
        <DialogTitle className="flex-1">
          {transaction ? 'Editar transação' : 'Nova transação'}
        </DialogTitle>
        <DialogDescription className="sr-only">
          Informe os dados do lançamento.
        </DialogDescription>
        <DialogClose
          render={
            <Button
              variant="ghost"
              size="icon"
              aria-label="Fechar"
              className="cursor-pointer"
            />
          }
        >
          <X />
        </DialogClose>
      </DialogHeader>

      <TransactionForm
        transaction={transaction ?? undefined}
        onSuccess={onSuccess}
      />
    </DialogContent>
  </Dialog>
)
