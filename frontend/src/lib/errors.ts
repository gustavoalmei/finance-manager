import { isAxiosError } from 'axios'

export type AppError = {
  message: string
  status?: number
  code?: string
}

const STATUS_MESSAGES: Record<number, string> = {
  400: 'Requisição inválida.',
  401: 'Sessão expirada. Faça login novamente.',
  403: 'Você não tem permissão para realizar essa ação.',
  404: 'Recurso não encontrado.',
  409: 'Conflito ao processar a requisição.',
  422: 'Dados inválidos. Verifique os campos informados.',
  429: 'Muitas requisições. Tente novamente em instantes.',
  500: 'Erro interno do servidor. Tente novamente mais tarde.',
  503: 'Serviço indisponível no momento.',
}

const DEFAULT_MESSAGE = 'Ocorreu um erro inesperado. Tente novamente.'
const NETWORK_ERROR_MESSAGE = 'Não foi possível conectar ao servidor. Verifique sua conexão.'

export const parseError = (error: unknown): AppError => {
  if (isAxiosError(error)) {
    if (!error.response) {
      return { message: NETWORK_ERROR_MESSAGE, code: error.code }
    }

    const { status, data } = error.response
    const message = data?.message ?? STATUS_MESSAGES[status] ?? DEFAULT_MESSAGE

    return { message, status, code: error.code }
  }

  if (error instanceof Error) {
    return { message: error.message || DEFAULT_MESSAGE }
  }

  return { message: DEFAULT_MESSAGE }
}

export const getErrorMessage = (error: unknown): string => parseError(error).message

export const isUnauthorizedError = (error: unknown): boolean =>
  isAxiosError(error) && error.response?.status === 401
