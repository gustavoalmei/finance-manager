import api from '../api'

export const cardBrandLabels = {
  VISA: 'Visa',
  MASTERCARD: 'Mastercard',
  ELO: 'Elo',
  AMEX: 'American Express',
  HIPERCARD: 'Hipercard',
  DINERS: 'Diners Club',
  OTHER: 'Outra',
} as const

export type CardBrand = keyof typeof cardBrandLabels

export type CreditCard = {
  id: string
  userId: string
  accountId: string
  name: string
  description: string | null
  brand: CardBrand
  // cartões antigos podem não ter
  lastFourDigits: string | null
  creditLimit: number
  // dia do mês (1–31)
  closingDay: number
  dueDay: number
  createdAt: string
  updatedAt: string
  // calculados pelo back (centavos): compras − pagamentos de fatura
  usedCredit: number
  availableCredit: number
  currentInvoice: {
    amount: number
    periodStart: string
    closingDate: string
    dueDate: string
  }
}

export type CreditCardInput = Pick<
  CreditCard,
  'name' | 'brand' | 'creditLimit' | 'closingDay' | 'dueDay'
> & {
  description?: string
  lastFourDigits: string
  // só na criação: o PUT não move o cartão de conta
  accountId?: string
}

// O formulário deve enviar só isto: o número completo não sai do navegador
export const toLastFourDigits = (cardNumber: string) =>
  cardNumber.replace(/\D/g, '').slice(-4)

export const formatDay = (day: number) => String(day).padStart(2, '0')

export const maskCardNumber = (lastFourDigits: string | null) =>
  lastFourDigits ? `•••• ${lastFourDigits}` : null

export const creditCards = {
  list: async (): Promise<CreditCard[]> => {
    const { data } = await api.get('/card')
    return data
  },
  create: async (input: CreditCardInput): Promise<CreditCard> => {
    const { data } = await api.post('/card', input)
    return data
  },
  // PUT: substitui o cartão inteiro, então recebe todos os campos
  update: async (id: string, input: CreditCardInput) => {
    const { data } = await api.put(`/card/${id}`, input)
    return data
  },
  remove: async (id: string) => {
    const { data } = await api.delete(`/card/${id}`)
    return data
  },
}
