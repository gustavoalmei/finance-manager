import api from './api'

// /health responde 200 só quando a API e o banco estão de pé (503 se o banco caiu)
export const pingBackend = (timeout: number) =>
  api
    .get('/health', { timeout })
    .then(() => true)
    .catch(() => false)

export class BackendUnavailableError extends Error {
  constructor() {
    super('Não foi possível conectar ao servidor')
    this.name = 'BackendUnavailableError'
  }
}

const RETRY_DELAY_MS = 2_000
const REQUEST_TIMEOUT_MS = 15_000
// Contado a partir do primeiro erro: no cold start a requisição costuma ficar
// pendente (não falha) até o backend subir, então isso não interrompe a espera normal.
const GIVE_UP_AFTER_ERRORS_FOR_MS = 10_000

let ready: Promise<void> | null = null

const poll = async () => {
  let firstErrorAt: number | null = null
  while (!(await pingBackend(REQUEST_TIMEOUT_MS))) {
    firstErrorAt ??= Date.now()
    if (Date.now() - firstErrorAt >= GIVE_UP_AFTER_ERRORS_FOR_MS) throw new BackendUnavailableError()
    await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS))
  }
}

// Espera o backend acordar (hiberna após inatividade). Só no cliente: no servidor
// a rota só é renderizada quando o ping do `ssr` já confirmou que ele está de pé.
// Memoizado: depois da primeira confirmação as navegações não pingam de novo.
export const waitForBackend = () => {
  if (typeof window === 'undefined') return Promise.resolve()
  ready ??= poll().catch((error) => {
    ready = null
    throw error
  })
  return ready
}
