import api from '../api'

export type Account = {
  id: string
  userId: string
  name: string
  // tipo da conta: corrente, poupança...
  type: string
  accountBalance: number
  createdAt: string
  updatedAt: string
}

export type AccountInput = Pick<Account, 'name' | 'type' | 'accountBalance'>

export const accounts = {
  list: async (): Promise<Account[]> => {
    const { data } = await api.get('/accounts')
    return data
  },
  create: async (input: AccountInput): Promise<Account> => {
    const { data } = await api.post('/account', input)
    return data
  },
  update: async (id: string, input: AccountInput): Promise<Account> => {
    const { data } = await api.put(`/account/${id}`, input)
    return data
  },
  remove: async (id: string) => {
    const { data } = await api.delete(`/account/${id}`)
    return data
  },
}
