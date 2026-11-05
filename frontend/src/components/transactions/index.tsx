import { useState } from 'react'
import type { ReactNode } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Plus, Sparkles, Upload } from 'lucide-react'
import { useAccountSelection } from '#/components/accounts/account-selection-context'
import { RowActions } from '#/components/shared/row-actions'
import { Button } from '#/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#/components/ui/select'
import { TableCustom } from '#/components/ui/table'
import type { TableColumn } from '#/components/ui/table'
import { useDialogState } from '#/hooks/use-dialog-state'
import { useMonthStartDay } from '#/hooks/use-month-start-day'
import { accountsQueryOptions } from '#/lib/accounts/queries'
import { categoriesQueryOptions } from '#/lib/categories/queries'
import { creditCardsQueryOptions } from '#/lib/creditCard/queries'
import { formatCurrency, formatDateUTC } from '#/lib/format'
import {
  currentMonthRange,
  periodToISO,
  transactionStatusLabels,
  transactionTypeLabels,
} from '#/lib/transactions'
import type {
  Transaction,
  TransactionStatus,
  TransactionType,
} from '#/lib/transactions'
import { transactionsQueryOptions } from '#/lib/transactions/queries'
import { cn } from '#/lib/utils'
import { AiTransactionsDialog } from './ai-transactions-dialog'
import { DeleteTransactionDialog } from './delete-transaction-dialog'
import { ImportTransactionsDialog } from './import-transactions-dialog'
import { TransactionFormDialog } from './transaction-form-dialog'
import { PeriodFilter } from './period-filter'
import { SummaryCards } from './summary-cards'

type TransactionRow = {
  id: string
  date: string
  description: string
  category: string
  payment: string
  status: ReactNode
  amount: ReactNode
  actions: ReactNode
}

const columns: Array<TableColumn<TransactionRow>> = [
  { label: 'Data', value: 'date' },
  { label: 'Descrição', value: 'description' },
  { label: 'Categoria', value: 'category' },
  { label: 'Pagamento', value: 'payment' },
  { label: 'Status', value: 'status' },
  { label: 'Valor', value: 'amount' },
  { label: 'Ações', value: 'actions' },
]

const types = Object.entries(transactionTypeLabels) as Array<
  [TransactionType, string]
>
const statuses = Object.entries(transactionStatusLabels) as Array<
  [TransactionStatus, string]
>

// sinal e cor dizem a direção do dinheiro; transferência é neutra
const amountStyles: Record<
  TransactionType,
  { sign: string; className: string }
> = {
  INCOME: { sign: '+', className: 'text-success' },
  EXPENSE: { sign: '−', className: 'text-destructive-text' },
  TRANSFER: { sign: '', className: 'text-foreground' },
}

const statusClasses: Record<TransactionStatus, string> = {
  PENDING: 'text-warning',
  CONFIRMED: 'text-muted-foreground',
  CANCELLED: 'text-muted-foreground line-through',
}

const filterClass = 'rounded-2xl sm:w-44'

export const Transactions = () => {
  // começa no mês financeiro atual do usuário
  const monthStartDay = useMonthStartDay()
  const [period, setPeriod] = useState(() => currentMonthRange(monthStartDay))
  const [type, setType] = useState<TransactionType | ''>('')
  const [status, setStatus] = useState<TransactionStatus | ''>('')
  const [createOpen, setCreateOpen] = useState(false)
  const [importOpen, setImportOpen] = useState(false)
  const [aiOpen, setAiOpen] = useState(false)
  const editDialog = useDialogState<Transaction>()
  const deleteDialog = useDialogState<Transaction>()
  const { selectedAccount, selectedCard, isSelectionReady } =
    useAccountSelection()

  // Busca a conta inteira (inclui as compras de todos os cartões dela);
  // com cartão selecionado, a conta é a do cartão
  const accountId = selectedCard?.accountId ?? selectedAccount?.id
  const scope = accountId ? { accountId } : {}
  const scopeLabel = selectedCard
    ? `${selectedAccount?.name ?? 'Conta'} + cartão ${selectedCard.name}`
    : (selectedAccount?.name ?? 'Todas as contas')

  // Só o período vai para o back: os cards de resumo precisam do período inteiro,
  // então tipo e status filtram a tabela aqui, sem uma 2ª requisição
  const { data: accountTransactions = [], isPending } = useQuery({
    ...transactionsQueryOptions({ period: periodToISO(period), ...scope }),
    // espera a seleção do header: buscar antes traria transações de todas as contas
    enabled: isSelectionReady,
  })
  // cartão selecionado: lançamentos diretos da conta + compras só desse cartão
  const periodTransactions = selectedCard
    ? accountTransactions.filter(
      (item) => !item.cardId || item.cardId === selectedCard.id,
    )
    : accountTransactions
  // o back devolve só os IDs: os nomes vêm das listas já em cache
  const { data: categories = [] } = useQuery(categoriesQueryOptions())
  const { data: accounts = [] } = useQuery(accountsQueryOptions())
  const { data: cards = [] } = useQuery(creditCardsQueryOptions())

  const categoryNames = new Map(categories.map((item) => [item.id, item.name]))
  const accountNames = new Map(accounts.map((item) => [item.id, item.name]))
  const cardNames = new Map(cards.map((item) => [item.id, item.name]))

  const visibleTransactions = periodTransactions
    .filter(
      (item) =>
        (!type || item.type === type) && (!status || item.status === status),
    )
    // criadas por último primeiro (o filter já devolve um array novo)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))

  const toRow = (transaction: Transaction): TransactionRow => {
    const { sign, className } = amountStyles[transaction.type]
    const installment = transaction.totalInstallments
      ? ` (${transaction.installmentNumber}/${transaction.totalInstallments})`
      : ''

    return {
      id: transaction.id,
      date: formatDateUTC(transaction.date),
      description: transaction.description + installment,
      category: categoryNames.get(transaction.categoryId) ?? '—',
      payment: transaction.cardId
        ? `Cartão ${cardNames.get(transaction.cardId) ?? ''}`.trim()
        : (accountNames.get(transaction.accountId) ?? '—'),
      status: (
        <span
          className={cn(
            'text-xs font-medium',
            statusClasses[transaction.status],
          )}
        >
          {transactionStatusLabels[transaction.status]}
        </span>
      ),
      amount: (
        <span className={cn('sensitive font-semibold tabular-nums', className)}>
          {sign}
          {formatCurrency(transaction.amount / 100)}
        </span>
      ),
      actions: (
        <RowActions
          label={`transação ${transaction.description}`}
          // transferência tem fluxo próprio no back: o modal não a edita
          onEdit={
            transaction.type === 'TRANSFER'
              ? undefined
              : () => editDialog.show(transaction)
          }
          onDelete={() => deleteDialog.show(transaction)}
        />
      ),
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex sm:items-center justify-between gap-2 flex-wrap sm:flex-row flex-col">
        <div>
          <h1 className="text-2xl font-semibold">Transações</h1>
          <small className="text-muted-foreground">{scopeLabel}</small>
        </div>
        <div className="flex gap-2 sm:flex-row flex-col">
          <Button variant="outline" onClick={() => setAiOpen(true)}>
            <Sparkles /> Lançar com IA
          </Button>
          <Button variant="outline" onClick={() => setImportOpen(true)}>
            <Upload /> Importar
          </Button>
          <Button onClick={() => setCreateOpen(true)}>
            <Plus /> Nova transação
          </Button>
        </div>
      </div>

      <SummaryCards transactions={periodTransactions} isLoading={isPending} />

      <TableCustom
        label=""
        columns={columns}
        items={visibleTransactions.map(toRow)}
        isLoading={isPending}
        getRowKey={(row) => row.id}
        searchable
        searchPlaceholder="Buscar por descrição ou categoria"
        filters={
          <>
            <PeriodFilter
              value={period}
              onChange={setPeriod}
              monthStartDay={monthStartDay}
            />
            <Select
              items={transactionTypeLabels}
              value={type || null}
              onValueChange={(value) => setType(value ?? '')}
            >
              <SelectTrigger
                aria-label="Tipo de transação"
                className={filterClass}
              >
                <SelectValue placeholder="Tipo de transação" />
              </SelectTrigger>
              <SelectContent>
                {/* null limpa o filtro e volta a mostrar o placeholder */}
                <SelectItem value={null}>Todos os tipos</SelectItem>
                {types.map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              items={transactionStatusLabels}
              value={status || null}
              onValueChange={(value) => setStatus(value ?? '')}
            >
              <SelectTrigger aria-label="Status" className={filterClass}>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={null}>Todos os status</SelectItem>
                {statuses.map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </>
        }
        emptyState={{
          title: 'Nenhuma transação neste período',
          description: 'Escolha outro período ou cadastre um lançamento.',
          action: (
            <Button onClick={() => setCreateOpen(true)}>
              <Plus /> Nova transação
            </Button>
          ),
        }}
      />

      <TransactionFormDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSuccess={() => setCreateOpen(false)}
      />
      <AiTransactionsDialog
        open={aiOpen}
        onOpenChange={setAiOpen}
        onSuccess={() => setAiOpen(false)}
      />
      <ImportTransactionsDialog
        open={importOpen}
        onOpenChange={setImportOpen}
        onSuccess={() => setImportOpen(false)}
      />
      <TransactionFormDialog
        {...editDialog.rootProps}
        transaction={editDialog.target}
        onSuccess={editDialog.close}
      />
      <DeleteTransactionDialog
        {...deleteDialog.rootProps}
        transaction={deleteDialog.target}
        onSuccess={deleteDialog.close}
      />
    </div>
  )
}
