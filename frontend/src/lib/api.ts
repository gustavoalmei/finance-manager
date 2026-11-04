import axios from 'axios'
import { createIsomorphicFn } from '@tanstack/react-start'
import { getRequestHeader } from '@tanstack/react-start/server'

// Servidor (SSR): chama o backend direto, sem passar pelo proxy.
// Cliente: chama /api no mesmo domínio, que o proxy do Nitro repassa ao backend
// (ver routeRules em vite.config.ts).
const getBaseURL = createIsomorphicFn()
  .server(() => process.env.API_URL)
  .client(() => '/api')

// No servidor o axios não tem acesso aos cookies do navegador,
// então repassamos o header `cookie` da requisição original.
// No cliente o navegador envia os cookies sozinho.
// O compilador do TanStack Start remove o ramo `.server()` (e o import
// de '@tanstack/react-start/server') do bundle do cliente.
const getForwardedCookie = createIsomorphicFn()
  .server(() => getRequestHeader('cookie'))
  .client(() => undefined)

export const api = axios.create({
  withCredentials: true,
})

api.interceptors.request.use((config) => {
  config.baseURL = getBaseURL()
  const cookie = getForwardedCookie()
  if (cookie) config.headers.set('cookie', cookie)
  return config
})

export default api
