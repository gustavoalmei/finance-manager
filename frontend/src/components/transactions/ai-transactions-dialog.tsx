import { useState } from 'react'
import type { ReactNode } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  ArrowLeft,
  CircleAlert,
  CircleCheck,
  Sparkles,
  Trash2,
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
import { Textarea } from '#/components/ui/textarea'
import type { DialogRootProps } from '#/hooks/use-dialog-state'
import { usePersistedId } from '#/hooks/use-persisted-id'
import { categoriesQueryOptions } from '#/lib/categories/queries'
import { creditCardsQueryOptions } from '#/lib/creditCard/queries'
import { formatDay } from '#/lib/dashboard'
import { formatCurrency } from '#/lib/format'
import { toaster } from '#/lib/toaster'
import {
  AI_MAX_TEXT_LENGTH,
  aiSourceLabels,
  transactions,
} from '#/lib/transactions'
import type {
  AiDraft,
  AiExtractResult,
  AiReconciliation,
  AiSourceType,
} from '#/lib/transactions'
import { aiModelsQueryOptions } from '#/lib/transactions/queries'
import { cn } from '#/lib/utils'

const MODEL_STORAGE_KEY = 'finance-manager-ai-model'
const MAX_INSTALLMENTS = 48

const typeLabels = { EXPENSE: 'Despesa', INCOME: 'Receita' } as const
const statusLabels = {
  CONFIRMED: 'Confirmada',
  PENDING: 'Pendente',
} as const

const textPlaceholder = `Cole aqui notificações, extrato ou anotações. Ex.:
20/10 Padaria 18,50
PIX recebido salário 5.000,00 dia 05
Nubank TV PARC 04/10 150,00
Aluguel 1.500 a pagar dia 10/11`

// só dígitos, lidos como centavos: digitar "1850" mostra R$ 18,50 (igual ao formulário)
const parseCents = (text: string) =>
  Number(text.replace(/\D/g, '').slice(0, 12))

// "aaaa-mm-dd" ↔ dia local do calendário
const toDay = (iso: string) => {
  const [year, month, day] = iso.split('-').map(Number) as [
    number,
    number,
    number,
  ]
  return new Date(year, month - 1, day)
}

// rascunho em edição: key estável para a lista (linhas podem ser removidas)
type Row = AiDraft & { key: string }

// O que impede lançar a linha (os avisos da IA só informam)
const rowErrors = (row: Row) =>
  [
    !row.description.trim() && 'Informe a descrição.',
    row.amount <= 0 && 'Informe o valor.',
    !row.categoryId && 'Escolha a categoria.',
    row.installmentCurrent > row.installmentTotal &&
      'A parcela atual não pode ser maior que o total.',
    row.installmentTotal > 1 &&
      !row.cardId &&
      'Compra parcelada precisa de um cartão.',
  ].filter((error): error is string => Boolean(error))

// ---------- passo 1: texto ----------

type TextStepProps = {
  onExtracted: (result: AiExtractResult) => void
}

const TextStep = ({ onExtracted }: TextStepProps) => {
  const [text, setText] = useState('')
  // lembra o modelo escolhido neste navegador; null = automático (padrão do back)
  const [model, setModel] = usePersistedId(MODEL_STORAGE_KEY)
  const { data: models = [], isPending: modelsPending } = useQuery(
    aiModelsQueryOptions(),
  )
  // modelo salvo que saiu da lista gratuita: volta para o automático
  const selectedModel = models.some((item) => item.id === model) ? model : null
  const modelItems = Object.fromEntries(
    models.map((item) => [item.id, item.name]),
  )
  const [source, setSource] = useState<AiSourceType>('auto')
  // fatura: começa no cartão do header
  const { selectedCard } = useAccountSelection()
  const { data: cards = [] } = useQuery(creditCardsQueryOptions())
  const [cardId, setCardId] = useState(selectedCard?.id ?? null)
  const cardItems = Object.fromEntries(
    cards.map((card) => [card.id, card.name]),
  )
  const missingCard = source === 'card' && !cardId

  const extractMutation = useMutation({
    mutationFn: () =>
      transactions.aiExtract({
        text: text.trim(),
        ...(selectedModel && { model: selectedModel }),
        source,
        ...(source === 'card' && cardId && { cardId }),
      }),
    onSuccess: (result) => {
      if (result.drafts.length === 0) {
        toaster.warning('A IA não encontrou transações nesse texto.')
        return
      }
      onExtracted(result)
    },
    onError: (error) => toaster.error(error),
  })

  return (
    <div className="flex flex-col gap-4">
      <FormField
        htmlFor="ai-model"
        label="Modelo de IA"
        hint="Modelos gratuitos do OpenRouter. Se o escolhido falhar, outro assume."
      >
        <Select
          items={modelItems}
          value={selectedModel}
          onValueChange={setModel}
          disabled={modelsPending}
        >
          <SelectTrigger id="ai-model">
            <SelectValue
              placeholder={
                modelsPending ? 'Carregando modelos...' : 'Automático (padrão)'
              }
            />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={null}>Automático (padrão)</SelectItem>
            {models.map((item) => (
              <SelectItem key={item.id} value={item.id}>
                {item.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FormField>

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField
          htmlFor="ai-source"
          label="Tipo de dado"
          hint={
            source === 'card'
              ? 'Todas as compras vão para o cartão escolhido.'
              : source === 'account'
                ? 'Nada vai para cartão; parcelas viram débitos comuns.'
                : 'Mistura de conta e cartão: a IA decide linha a linha.'
          }
        >
          <Select
            items={aiSourceLabels}
            value={source}
            onValueChange={(value) => value && setSource(value)}
          >
            <SelectTrigger id="ai-source">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(aiSourceLabels) as Array<AiSourceType>).map(
                (option) => (
                  <SelectItem key={option} value={option}>
                    {aiSourceLabels[option]}
                  </SelectItem>
                ),
              )}
            </SelectContent>
          </Select>
        </FormField>

        {source === 'card' && (
          <FormField
            htmlFor="ai-card"
            label="Cartão da fatura"
            error={missingCard ? 'Escolha o cartão.' : undefined}
          >
            <Select items={cardItems} value={cardId} onValueChange={setCardId}>
              <SelectTrigger id="ai-card" aria-invalid={missingCard}>
                <SelectValue
                  placeholder={
                    cards.length === 0 ? 'Nenhum cartão cadastrado' : 'Escolha'
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {cards.map((card) => (
                  <SelectItem key={card.id} value={card.id}>
                    {card.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>
        )}
      </div>

      <FormField
        htmlFor="ai-text"
        label="Texto com as transações"
        hint={`${text.length}/${AI_MAX_TEXT_LENGTH} caracteres. Nada é lançado antes da sua revisão.`}
      >
        <Textarea
          id="ai-text"
          value={text}
          onChange={(event) => setText(event.target.value)}
          maxLength={AI_MAX_TEXT_LENGTH}
          placeholder={textPlaceholder}
          className="min-h-48"
          autoFocus
        />
      </FormField>

      <DialogFooter>
        <DialogClose render={<Button type="button" variant="outline" />}>
          Cancelar
        </DialogClose>
        <Button
          type="button"
          disabled={!text.trim() || missingCard || extractMutation.isPending}
          onClick={() => extractMutation.mutate()}
          className="bg-nav-active text-nav-active-foreground"
        >
          <Sparkles />
          {extractMutation.isPending ? 'Analisando...' : 'Analisar com IA'}
        </Button>
      </DialogFooter>
    </div>
  )
}

// ---------- passo 2: revisão ----------

type DraftEditorProps = {
  row: Row
  index: number
  showErrors: boolean
  categoryItems: Record<string, string>
  cardItems: Record<string, string>
  onChange: (row: Row) => void
  onRemove: () => void
}

const Labeled = ({
  htmlFor,
  label,
  children,
  className,
}: {
  htmlFor: string
  label: string
  children: ReactNode
  className?: string
}) => (
  <div className={cn('flex min-w-0 flex-col gap-1', className)}>
    <label htmlFor={htmlFor} className="text-xs text-muted-foreground">
      {label}
    </label>
    {children}
  </div>
)

const DraftEditor = ({
  row,
  index,
  showErrors,
  categoryItems,
  cardItems,
  onChange,
  onRemove,
}: DraftEditorProps) => {
  const id = (field: string) => `draft-${row.key}-${field}`
  const errors = rowErrors(row)
  const set = (patch: Partial<Row>) => onChange({ ...row, ...patch })

  return (
    <li
      className={cn(
        'flex flex-col gap-3 rounded-xl border border-border bg-background p-3',
        showErrors && errors.length > 0 && 'border-destructive-text',
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-semibold text-muted-foreground">
          Transação {index + 1}
        </span>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label={`Remover transação ${index + 1}`}
          onClick={onRemove}
        >
          <Trash2 />
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Labeled
          htmlFor={id('description')}
          label="Descrição"
          className="col-span-2"
        >
          <Input
            id={id('description')}
            value={row.description}
            maxLength={255}
            onChange={(event) => set({ description: event.target.value })}
          />
        </Labeled>
        <Labeled htmlFor={id('amount')} label="Valor">
          <Input
            id={id('amount')}
            inputMode="numeric"
            autoComplete="off"
            value={formatCurrency(row.amount / 100)}
            onChange={(event) =>
              set({ amount: parseCents(event.target.value) })
            }
          />
        </Labeled>
        <Labeled htmlFor={id('date')} label="Data">
          <DatePicker
            id={id('date')}
            value={toDay(row.date)}
            onChange={(day) => set({ date: formatDay(day) })}
          />
        </Labeled>

        <Labeled htmlFor={id('type')} label="Tipo">
          <Select
            items={typeLabels}
            value={row.type}
            onValueChange={(type) =>
              type &&
              // receita não vai no cartão (nem parcelada)
              set(
                type === 'INCOME'
                  ? {
                      type,
                      cardId: null,
                      installmentCurrent: 1,
                      installmentTotal: 1,
                    }
                  : { type },
              )
            }
          >
            <SelectTrigger id={id('type')}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="EXPENSE">{typeLabels.EXPENSE}</SelectItem>
              <SelectItem value="INCOME">{typeLabels.INCOME}</SelectItem>
            </SelectContent>
          </Select>
        </Labeled>
        <Labeled htmlFor={id('status')} label="Status">
          <Select
            items={statusLabels}
            value={row.status}
            onValueChange={(status) => status && set({ status })}
          >
            <SelectTrigger id={id('status')}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="CONFIRMED">
                {statusLabels.CONFIRMED}
              </SelectItem>
              <SelectItem value="PENDING">{statusLabels.PENDING}</SelectItem>
            </SelectContent>
          </Select>
        </Labeled>
        <Labeled
          htmlFor={id('category')}
          label="Categoria"
          className="col-span-2"
        >
          <Select
            items={categoryItems}
            value={row.categoryId}
            onValueChange={(categoryId) => set({ categoryId })}
          >
            <SelectTrigger
              id={id('category')}
              aria-invalid={showErrors && !row.categoryId}
            >
              <SelectValue placeholder="Escolha" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(categoryItems).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Labeled>

        {row.type === 'EXPENSE' && (
          <>
            <Labeled htmlFor={id('card')} label="Cartão" className="col-span-2">
              <Select
                items={cardItems}
                value={row.cardId}
                onValueChange={(cardId) =>
                  set(
                    cardId
                      ? { cardId }
                      : // sem cartão: à vista
                        { cardId, installmentCurrent: 1, installmentTotal: 1 },
                  )
                }
              >
                <SelectTrigger id={id('card')}>
                  <SelectValue placeholder="Sem cartão (conta)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={null}>Sem cartão (conta)</SelectItem>
                  {Object.entries(cardItems).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Labeled>
            {row.cardId && (
              <>
                <Labeled htmlFor={id('current')} label="Parcela atual">
                  <Input
                    id={id('current')}
                    type="number"
                    min={1}
                    max={row.installmentTotal}
                    value={row.installmentCurrent}
                    onChange={(event) =>
                      set({
                        installmentCurrent: Math.max(
                          1,
                          Number(event.target.value) || 1,
                        ),
                      })
                    }
                  />
                </Labeled>
                <Labeled htmlFor={id('total')} label="Total de parcelas">
                  <Input
                    id={id('total')}
                    type="number"
                    min={1}
                    max={MAX_INSTALLMENTS}
                    value={row.installmentTotal}
                    onChange={(event) =>
                      set({
                        installmentTotal: Math.min(
                          MAX_INSTALLMENTS,
                          Math.max(1, Number(event.target.value) || 1),
                        ),
                      })
                    }
                  />
                </Labeled>
              </>
            )}
          </>
        )}
      </div>

      {row.cardId && row.installmentTotal > 1 && (
        <p className="text-[11px] text-muted-foreground">
          {`Valor total da compra: ${row.installmentTotal}x de ${formatCurrency(Math.round(row.amount / row.installmentTotal) / 100)}`}
          {row.installmentCurrent > 1 &&
            `; lança as parcelas ${row.installmentCurrent} a ${row.installmentTotal}`}
          .
        </p>
      )}

      {/* avisos da IA (informam) e erros (impedem lançar) */}
      {(row.warnings.length > 0 || (showErrors && errors.length > 0)) && (
        <ul className="flex flex-col gap-1 text-xs">
          {row.warnings.map((warning) => (
            <li key={warning} className="flex gap-1.5 text-warning">
              <CircleAlert aria-hidden className="mt-0.5 size-3.5 shrink-0" />
              {warning}
            </li>
          ))}
          {showErrors &&
            errors.map((error) => (
              <li
                key={error}
                role="alert"
                className="flex gap-1.5 text-destructive-text"
              >
                <CircleAlert aria-hidden className="mt-0.5 size-3.5 shrink-0" />
                {error}
              </li>
            ))}
        </ul>
      )}
    </li>
  )
}

type ReviewStepProps = {
  result: AiExtractResult
  onBack: () => void
  onSuccess: () => void
}

// Conferência dos valores: o texto do usuário é a referência, a IA não
// pode criar valor que não está nele nem pular valor que está
const ReconciliationSummary = ({
  reconciliation,
}: {
  reconciliation: AiReconciliation
}) => {
  const { sourceTotal, extractedTotal, omitted } = reconciliation
  const matches = sourceTotal === extractedTotal && omitted.length === 0

  return (
    <div
      className={cn(
        'flex flex-col gap-2 rounded-lg border p-3 text-xs',
        matches
          ? 'border-border'
          : 'border-destructive-text/40 bg-destructive-soft',
      )}
    >
      <p className="flex items-center gap-2 font-medium">
        {matches ? (
          <CircleCheck
            aria-hidden="true"
            className="size-4 shrink-0 text-nav-active"
          />
        ) : (
          <CircleAlert
            aria-hidden="true"
            className="size-4 shrink-0 text-destructive-text"
          />
        )}
        {matches
          ? 'Valores conferidos com o texto'
          : 'Os valores não batem com o texto: confira'}
      </p>
      <p className="text-muted-foreground">
        Texto {formatCurrency(sourceTotal / 100)} · Importação{' '}
        {formatCurrency(extractedTotal / 100)}
      </p>
      {omitted.length > 0 && (
        <details>
          <summary className="cursor-pointer">
            {omitted.length === 1
              ? '1 valor do texto não virou transação'
              : `${omitted.length} valores do texto não viraram transação`}{' '}
            (pode ser saldo ou total ignorado)
          </summary>
          <ul className="mt-1 flex flex-col gap-0.5 text-muted-foreground">
            {omitted.map((item) => (
              <li key={`${item.line}-${item.amount}`}>
                Linha {item.line}: {item.text} —{' '}
                {formatCurrency(item.amount / 100)}
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  )
}

const ReviewStep = ({ result, onBack, onSuccess }: ReviewStepProps) => {
  const queryClient = useQueryClient()
  const { data: categories = [] } = useQuery(categoriesQueryOptions())
  const { data: cards = [] } = useQuery(creditCardsQueryOptions())
  const defaultAccountId = useDefaultAccountId()
  const [accountId, setAccountId] = useState(defaultAccountId)
  const [rows, setRows] = useState<Array<Row>>(() =>
    result.drafts.map((draft) => ({ ...draft, key: crypto.randomUUID() })),
  )
  const [submitted, setSubmitted] = useState(false)

  const categoryItems = Object.fromEntries(
    categories.map((category) => [category.id, category.name]),
  )
  const cardItems = Object.fromEntries(
    cards.map((card) => [card.id, card.name]),
  )

  const needsAccount = rows.some((row) => !row.cardId)
  const accountError = needsAccount && !accountId
  const hasErrors =
    accountError || rows.some((row) => rowErrors(row).length > 0)

  const importMutation = useMutation({
    mutationFn: () =>
      transactions.importRows({
        ...(needsAccount && accountId && { accountId }),
        rows: rows.map(({ key, warnings, categoryId, ...row }) => ({
          ...row,
          // rowErrors garante a categoria antes de chegar aqui
          categoryId: categoryId!,
        })),
      }),
    onSuccess: (response: { message: string }) => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
      // saldo, limite do cartão e dashboard mudam junto
      queryClient.invalidateQueries({ queryKey: ['accounts'] })
      queryClient.invalidateQueries({ queryKey: ['credit-cards'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      toaster.success(response.message)
      onSuccess()
    },
    onError: (error) => toaster.error(error),
  })

  const submit = () => {
    setSubmitted(true)
    if (hasErrors || rows.length === 0) return
    importMutation.mutate()
  }

  return (
    // só a lista rola: conta e botões ficam sempre visíveis
    <div className="flex min-h-0 flex-1 flex-col gap-4">
      <div className="flex flex-col gap-3">
        <p className="text-xs text-muted-foreground">
          {rows.length === 1
            ? '1 transação encontrada'
            : `${rows.length} transações encontradas`}
          {result.model && ` · modelo ${result.model}`}
        </p>
        <ReconciliationSummary reconciliation={result.reconciliation} />
        {needsAccount && (
          <FormField
            htmlFor="ai-account"
            label="Conta"
            hint="Recebe as transações sem cartão. As do cartão vão para a conta do cartão."
            error={submitted && accountError ? 'Selecione a conta.' : undefined}
          >
            <AccountSelect
              id="ai-account"
              value={accountId}
              onChange={setAccountId}
              invalid={submitted && accountError}
            />
          </FormField>
        )}
      </div>

      <ol className="-mx-1 flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-1">
        {rows.map((row, index) => (
          <DraftEditor
            key={row.key}
            row={row}
            index={index}
            showErrors={submitted}
            categoryItems={categoryItems}
            cardItems={cardItems}
            onChange={(next) =>
              setRows((current) =>
                current.map((item) => (item.key === next.key ? next : item)),
              )
            }
            onRemove={() =>
              setRows((current) =>
                current.filter((item) => item.key !== row.key),
              )
            }
          />
        ))}
        {rows.length === 0 && (
          <li className="py-8 text-center text-sm text-muted-foreground">
            Todas as transações foram removidas.
          </li>
        )}
      </ol>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onBack}>
          <ArrowLeft /> Voltar ao texto
        </Button>
        <Button
          type="button"
          disabled={rows.length === 0 || importMutation.isPending}
          onClick={submit}
          className="bg-nav-active text-nav-active-foreground"
        >
          {importMutation.isPending
            ? 'Lançando...'
            : rows.length === 1
              ? 'Lançar 1 transação'
              : `Lançar ${rows.length} transações`}
        </Button>
      </DialogFooter>
    </div>
  )
}

// ---------- diálogo ----------

type AiTransactionsDialogProps = DialogRootProps & {
  onSuccess: () => void
}

// Montado só com o modal aberto: cada abertura começa no texto, sem rascunho antigo.
// Voltar ao texto desmonta a revisão: a próxima análise começa com rascunhos novos.
const AiTransactionsFlow = ({ onSuccess }: { onSuccess: () => void }) => {
  const [result, setResult] = useState<AiExtractResult | null>(null)

  return result ? (
    <ReviewStep
      result={result}
      onBack={() => setResult(null)}
      onSuccess={onSuccess}
    />
  ) : (
    <TextStep onExtracted={setResult} />
  )
}

export const AiTransactionsDialog = ({
  onSuccess,
  ...rootProps
}: AiTransactionsDialogProps) => (
  <Dialog {...rootProps}>
    {/* largo para a revisão; altura limitada também no desktop */}
    <DialogContent className="overflow-hidden md:max-h-[85svh] md:max-w-3xl">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <Sparkles className="size-4" /> Lançar com IA
        </DialogTitle>
        <DialogDescription>
          A IA organiza o texto em transações. Você revisa e corrige antes de
          lançar.
        </DialogDescription>
      </DialogHeader>

      <AiTransactionsFlow onSuccess={onSuccess} />
    </DialogContent>
  </Dialog>
)
