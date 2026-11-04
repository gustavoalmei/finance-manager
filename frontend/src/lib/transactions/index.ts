import api from '../api'

export const transactionTypeLabels = {
  INCOME: 'Receita',
  EXPENSE: 'Despesa',
  TRANSFER: 'Transferência',
} as const

export const transactionStatusLabels = {
  PENDING: 'Pendente',
  CONFIRMED: 'Confirmada',
  CANCELLED: 'Cancelada',
} as const

export type TransactionType = keyof typeof transactionTypeLabels
export type TransactionStatus = keyof typeof transactionStatusLabels

export type Transaction = {
  id: string
  userId: string
  accountId: string
  // só em transferências
  sourceAccountId: string | null
  destinationAccountId: string | null
  // só em compras no cartão
  cardId: string | null
  categoryId: string
  // parcelas apontam para a transação original
  parentTransactionId: string | null
  type: TransactionType
  status: TransactionStatus
  // centavos
  amount: number
  description: string
  date: string
  isRecurring: boolean
  installmentNumber: number | null
  totalInstallments: number | null
  createdAt: string
  updatedAt: string
  deletedAt: string | null
}

export type TransactionFilters = {
  // [início, fim] em ISO
  period?: [string, string]
  type?: TransactionType
  status?: TransactionStatus
  categoryId?: string
  accountId?: string
  cardId?: string
}

// dias escolhidos no calendário (datas locais, sem hora)
export type Period = { from: Date; to: Date }

// Dias locais → intervalo em UTC, o mesmo fuso em que as datas são salvas
export const periodToISO = ({ from, to }: Period): [string, string] => {
  const start = Date.UTC(from.getFullYear(), from.getMonth(), from.getDate())
  const end = Date.UTC(
    to.getFullYear(),
    to.getMonth(),
    to.getDate(),
    23,
    59,
    59,
    999,
  )
  return [new Date(start).toISOString(), new Date(end).toISOString()]
}

// Mês financeiro: vai do dia `startDay` até a véspera dele no mês seguinte
// (startDay 1 = mês do calendário; 5 = 05/10 a 04/11). Até 28: todo mês tem o dia.
export const monthCycle = (
  year: number,
  month: number,
  startDay = 1,
): Period => ({
  from: new Date(year, month, startDay),
  to: new Date(year, month + 1, startDay - 1),
})

// ciclo que contém o dia: antes do dia de início, ainda é o ciclo do mês anterior
export const cycleContaining = (day: Date, startDay = 1): Period =>
  monthCycle(
    day.getFullYear(),
    day.getMonth() - (day.getDate() < startDay ? 1 : 0),
    startDay,
  )

export const currentMonthRange = (startDay = 1): Period =>
  cycleContaining(new Date(), startDay)

// Corpo do POST/PUT. Em compra no cartão, amount é o valor de CADA parcela:
// o back cria as demais, uma por mês, a partir de date
export type TransactionInput = {
  // obrigatória fora do cartão; compra no cartão usa a conta do cartão
  accountId?: string
  categoryId: string
  type: Exclude<TransactionType, 'TRANSFER'>
  status: TransactionStatus
  amount: number
  description: string
  date: string
  isRecurring: boolean
  // só na criação: o PUT não troca o cartão
  cardId?: string
  installmentNumber?: number
  totalInstallments?: number
}

// dia local escolhido no calendário ↔ meia-noite UTC salva no back
export const dayToISO = (day: Date) =>
  new Date(
    Date.UTC(day.getFullYear(), day.getMonth(), day.getDate()),
  ).toISOString()

export const isoToDay = (iso: string) => {
  const date = new Date(iso)
  return new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())
}

// ---------- lançamento com IA (OpenRouter, modelos gratuitos) ----------

export type AiModel = { id: string; name: string; contextLength: number }

// rascunho devolvido pela IA: nada foi gravado ainda
export type AiDraft = {
  date: string // "aaaa-mm-dd"
  description: string
  // centavos
  amount: number
  type: Exclude<TransactionType, 'TRANSFER'>
  status: 'CONFIRMED' | 'PENDING'
  categoryId: string | null
  cardId: string | null
  installmentCurrent: number
  installmentTotal: number
  // o que conferir antes de lançar (ex.: possível duplicada)
  warnings: Array<string>
}

// conferência feita no back: valores da IA × valores do texto (centavos)
export type AiReconciliation = {
  sourceTotal: number
  extractedTotal: number
  // valores do texto que não viraram transação (omitidos ou ignorados, ex.: saldo)
  omitted: Array<{ line: number; text: string; amount: number }>
}

export type AiExtractResult = {
  drafts: Array<AiDraft>
  reconciliation: AiReconciliation
  // modelo(s) que responderam, um por bloco de 50 linhas (pode ser um reserva)
  model: string
}

// linha revisada pelo usuário, pronta para gravar
export type ReviewedRow = Omit<AiDraft, 'warnings' | 'categoryId'> & {
  categoryId: string
}

// mesmo limite do back (ai-extract.ts): o texto vai em blocos de 50 linhas
// de onde vem o texto: com a origem conhecida, o back aplica as regras
// (fatura → compras no cartão escolhido; extrato → nunca cartão)
export const aiSourceLabels = {
  auto: 'Automático (a IA identifica)',
  account: 'Extrato da conta',
  card: 'Fatura do cartão',
} as const

export type AiSourceType = keyof typeof aiSourceLabels

export const AI_MAX_TEXT_LENGTH = 20000

export const transactions = {
  list: async ({ period, ...filters }: TransactionFilters = {}): Promise<
    Transaction[]
  > => {
    const { data } = await api.get('/transactions/all', {
      // o back faz JSON.parse do período
      params: { ...filters, period: period && JSON.stringify(period) },
    })
    return data
  },
  create: async (input: TransactionInput) => {
    const { data } = await api.post('/transactions/create', input)
    return data
  },
  update: async (id: string, input: TransactionInput) => {
    const { data } = await api.put(`/transactions/${id}`, input)
    return data
  },
  remove: async (id: string) => {
    const { data } = await api.delete(`/transactions/${id}`)
    return data
  },
  // accountId: conta das linhas sem cartão
  aiModels: async (): Promise<Array<AiModel>> => {
    const { data } = await api.get('/transactions/ai/models')
    return data
  },
  // só lê e organiza o texto; a gravação é importRows, depois da revisão
  aiExtract: async (input: {
    text: string
    model?: string
    source: AiSourceType
    // só na fatura do cartão
    cardId?: string
  }): Promise<AiExtractResult> => {
    const { data } = await api.post('/transactions/ai/extract', input)
    return data
  },
  importRows: async (input: {
    accountId?: string
    rows: Array<ReviewedRow>
  }) => {
    const { data } = await api.post('/transactions/import-rows', input)
    return data
  },
  importFile: async (file: File, accountId?: string) => {
    const { data } = await api.post('/transactions/import', {
      accountId,
      file: await fileToBase64(file),
      name: file.name,
    })
    return data
  },
}

// O back valida com z.base64(), que recusa o prefixo "data:...;base64,"
const fileToBase64 = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result).split(',')[1] ?? '')
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
