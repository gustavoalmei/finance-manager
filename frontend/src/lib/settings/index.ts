import api from '../api'
import type { SessionUser } from '../auth'

export type ProfileInput = {
  name: string
  email: string
  // e-mail digitado duas vezes: ainda não há confirmação por link
  emailConfirmation: string
  // obrigatória só quando o e-mail muda
  currentPassword?: string
}

export type PasswordInput = {
  currentPassword: string
  newPassword: string
  confirmation: string
}

type RevokeResult = { message: string; revokedSessions: number }

export const settings = {
  updateProfile: async (input: ProfileInput): Promise<SessionUser> => {
    const { data } = await api.put('/me/profile', input)
    return data
  },
  // as outras sessões são encerradas junto
  changePassword: async (input: PasswordInput): Promise<RevokeResult> => {
    const { data } = await api.put('/me/password', input)
    return data
  },
  revokeOtherSessions: async (): Promise<RevokeResult> => {
    const { data } = await api.post('/me/sessions/revoke-others')
    return data
  },
  updatePreferences: async (input: {
    monthStartDay: number
  }): Promise<SessionUser> => {
    const { data } = await api.put('/me/preferences', input)
    return data
  },
}
