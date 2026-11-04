import api from '../api'

// GET /me
export type SessionUser = {
  id: string
  name: string
  email: string
  // dia de início do mês financeiro (1–28)
  monthStartDay: number
}

export const auth = {
  checkSession: async (): Promise<SessionUser> => {
    const { data } = await api.get('/me')
    return data
  },
  login: async (formData: any) => {
    const { data } = await api.post('/auth/login', formData)
    return data
  },
  logout: async () => {
    const { data } = await api.post('/auth/logout')
    return data
  },
  register: async (formData: any) => {
    const { data } = await api.post('/auth/register', formData)
    return data
  },
}
