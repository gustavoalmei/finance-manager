import { useState } from 'react'
import { createIsomorphicFn } from '@tanstack/react-start'
import { getCookie } from '@tanstack/react-start/server'
import { IoArrowBack } from 'react-icons/io5'
import { Logo } from '#/components/icons/logo'
import { cn } from '#/lib/utils'
import { MenuNav } from './menu-nav'

const COLLAPSED_COOKIE = 'finance-manager-sidebar-collapsed'
const ONE_YEAR = 60 * 60 * 24 * 365

// Cookie (não localStorage): o SSR já lê o valor e renderiza o menu certo,
// sem pulo de largura nem mismatch de hidratação.
// O compilador do Start remove o ramo .server() do bundle do cliente.
const readCollapsed = createIsomorphicFn()
  .server(() => getCookie(COLLAPSED_COOKIE) === 'true')
  .client(() =>
    document.cookie.split('; ').includes(`${COLLAPSED_COOKIE}=true`),
  )

const writeCollapsed = (collapsed: boolean) => {
  document.cookie = `${COLLAPSED_COOKIE}=${collapsed}; path=/; max-age=${ONE_YEAR}; samesite=lax`
}

export const Sidebar = () => {
  const [collapsed, setCollapsed] = useState(readCollapsed)

  const toggle = () => {
    setCollapsed(!collapsed)
    writeCollapsed(!collapsed)
  }

  return (
    <aside
      className={cn(
        'relative hidden h-full shrink-0 flex-col gap-6 transition-[width] duration-200 md:flex',
        collapsed ? 'w-10' : 'w-50',
      )}
    >
      <button
        type="button"
        onClick={toggle}
        aria-label={collapsed ? 'Expandir menu' : 'Recolher menu'}
        aria-expanded={!collapsed}
        className="absolute top-22 -right-6 z-10 cursor-pointer rounded-full bg-nav-active p-1 text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <IoArrowBack
          size={20}
          aria-hidden="true"
          className={cn(
            'transition-transform duration-200',
            collapsed && 'rotate-180',
          )}
        />
      </button>

      <div className="flex justify-center pt-2">
        <Logo />
      </div>

      <MenuNav collapsed={collapsed} />
    </aside>
  )
}
