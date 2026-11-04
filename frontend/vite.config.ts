import { defineConfig, loadEnv } from 'vite'
import { devtools } from '@tanstack/devtools-vite'

import { tanstackStart } from '@tanstack/react-start/plugin/vite'

import viteReact from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { nitro } from 'nitro/vite'

const config = defineConfig(({ mode }) => {
  // Prefixo '' carrega também variáveis sem VITE_ (que nunca vão para o bundle do cliente)
  const env = loadEnv(mode, process.cwd(), '')
  if (!env.API_URL) throw new Error('API_URL não definida')

  return {
    resolve: { tsconfigPaths: true },
    optimizeDeps: {
      // Só aparece num import() dinâmico: sem isso o Vite descobre o pacote no clique,
      // re-otimiza as deps, troca o hash (?v=) e o import falha com 504 no dev
      include: ['exceljs'],
    },
    plugins: [
      devtools(),
      nitro({
        routeRules: {
          // Navegador chama /api/* no próprio domínio do front e o Nitro repassa ao backend.
          // Na Vercel vira um rewrite de CDN (sem invocar função).
          // Assim o cookie de sessão fica no domínio do front e chega no SSR.
          '/api/**': { proxy: `${env.API_URL}/**` },
        },
      }),
      tailwindcss(),
      tanstackStart(),
      viteReact(),
    ],
  }
})

export default config
