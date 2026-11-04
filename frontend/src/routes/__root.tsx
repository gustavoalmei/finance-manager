import {
  HeadContent,
  Scripts,
  createRootRouteWithContext,
} from '@tanstack/react-router'
import { HideValuesProvider } from '../components/hide-values-provider'
import { ThemeProvider } from '../components/theme-provider'
import { Toaster } from '../components/ui/toaster'

import appCss from '../styles.css?url'

import type { QueryClient } from '@tanstack/react-query'

interface MyRouterContext {
  queryClient: QueryClient
}

export const Route = createRootRouteWithContext<MyRouterContext>()({
  head: () => ({
    meta: [
      {
        charSet: 'utf-8',
      },
      {
        name: 'viewport',
        // resizes-visual: o teclado do celular não encolhe o layout (h-svh continua com a altura da tela)
        content: 'width=device-width, initial-scale=1, interactive-widget=resizes-visual',
      },
      {
        title: 'Finance App',
        description: 'Finance App',
        keywords: 'finance, app',
      },
    ],
    links: [
      {
        rel: 'stylesheet',
        href: appCss,
      },
      {
        rel: 'icon',
        href: '../../public/favicon.ico',
      },
    ],
  }),
  shellComponent: RootDocument
})

// Precisa rodar antes da hidratação para evitar flash do tema errado e mismatch de hidratação;
// a chave precisa ser a mesma usada em ThemeProvider (storageKey).
const noFlashThemeScript = `
(function () {
  try {
    var stored = localStorage.getItem('finance-manager-theme');
    var theme = stored === 'light' || stored === 'dark' ? stored : 'system';
    var isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    document.documentElement.classList.add(isDark ? 'dark' : 'light');
    // "Ocultar valores" (chave de HideValuesProvider): evita mostrar os valores por um instante
    if (localStorage.getItem('finance-manager-hide-values') === 'true') {
      document.documentElement.classList.add('hide-values');
    }
  } catch (e) {}
})();
`

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-br" suppressHydrationWarning className="h-full">
      <head>
        <script dangerouslySetInnerHTML={{ __html: noFlashThemeScript }} />
        <HeadContent />
      </head>
      <body className="h-full">
        <ThemeProvider>
          <HideValuesProvider>
            {children}
            <Toaster />
          </HideValuesProvider>
        </ThemeProvider>
        <Scripts />
      </body>
    </html>
  )
}
