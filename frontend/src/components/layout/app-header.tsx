import { useMatches } from '@tanstack/react-router'
import { AccountSelectors } from '#/components/accounts/account-selectors'
import { HideValuesToggle } from '#/components/hide-values-toggle'

// Só desktop; no mobile quem cumpre esse papel é o MobileTopBar
export const AppHeader = () => {
  // a rota mais interna com título vence (ex.: /transactions/123 dentro de /transactions)
  const title = useMatches({
    select: (matches) =>
      matches
        .map((match) => match.staticData.title)
        .filter(Boolean)
        .at(-1),
  })

  return (
    <header className="hidden items-center justify-between gap-2 border-b border-border px-6 py-2 md:flex">
      <div className="flex items-center gap-3">
        {/* span, não heading: o <h1> de cada página continua sendo o título principal */}
        <span className="text-xl font-bold">{title}</span>
        <AccountSelectors />
      </div>
      <HideValuesToggle />
    </header>
  )
}
