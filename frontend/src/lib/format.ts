const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
})

export const formatCurrency = (value: number) => currencyFormatter.format(value)

const dateFormatter = new Intl.DateTimeFormat('pt-BR')

// recebe a data ISO que vem do back
export const formatDate = (value: string) => dateFormatter.format(new Date(value))

// Datas de lançamento vêm à meia-noite UTC: no fuso local (UTC-3) cairiam no dia anterior
const utcDateFormatter = new Intl.DateTimeFormat('pt-BR', { timeZone: 'UTC' })

export const formatDateUTC = (value: string) => utcDateFormatter.format(new Date(value))

// eixo de gráfico: "R$ 1,2 mil"
const compactCurrencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  notation: 'compact',
  maximumFractionDigits: 1,
})

export const formatCompactCurrency = (value: number) =>
  compactCurrencyFormatter.format(value)

// valores do back vêm em centavos
export const formatCents = (cents: number) => formatCurrency(cents / 100)
