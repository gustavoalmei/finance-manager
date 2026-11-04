import type { ComponentType, ReactNode } from 'react'
import { Link } from '@tanstack/react-router'
import { ThemeIcon } from '#/components/mode-toggle'
import { useThemeToggle } from '#/hooks/use-theme-toggle'
import { cn } from '#/lib/utils'
import { mainNavItems, settingsNavItems } from './nav-items'
import type { NavItem } from './nav-items'
import { useLogout } from '#/hooks/use-logout'
import { HiOutlineLogout } from "react-icons/hi";

// O <Link> marca a rota ativa com data-status="active"
const itemClasses = cn(
  'flex w-full cursor-pointer items-center gap-2.5 rounded-[10px] px-3.75 py-3.75 text-left text-sm font-medium transition-colors',
  'text-muted-foreground hover:bg-nav-active hover:text-nav-active-foreground',
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
  'data-[status=active]:bg-nav-active data-[status=active]:text-nav-active-foreground',
  'disabled:pointer-events-none disabled:opacity-50',
)

const navItemClass = (collapsed: boolean) => cn(itemClasses, collapsed && 'justify-center')

const NavLabel = ({ label, collapsed }: { label: string; collapsed: boolean }) => (
  <span className={cn('truncate', collapsed && 'sr-only')}>{label}</span>
)

type NavLinkProps = {
  item: NavItem
  collapsed: boolean
  onNavigate?: () => void
}

const NavLink = ({ item, collapsed, onNavigate }: NavLinkProps) => {
  const Icon = item.icon
  const content = (
    <>
      <Icon aria-hidden="true" className="size-4 shrink-0" />
      <NavLabel label={item.label} collapsed={collapsed} />
    </>
  )

  if (!item.to) {
    return (
      <button type="button" disabled className={navItemClass(collapsed)}>
        {content}
      </button>
    )
  }

  return (
    <Link
      to={item.to}
      // sem exact, "/" ficaria ativo em todas as rotas.
      // includeSearch false: filtros na URL (ex.: ?period=3m) não desmarcam o item
      activeOptions={{ exact: item.to === '/', includeSearch: false }}
      title={collapsed ? item.label : undefined}
      className={navItemClass(collapsed)}
      onClick={onNavigate}
    >
      {content}
    </Link>
  )
}

type NavButtonProps = {
  icon: ComponentType<{ className?: string }>
  label: string
  onClick: () => void
  collapsed?: boolean
}

// Ação com o mesmo visual dos links do menu
export const NavButton = ({ icon: Icon, label, onClick, collapsed = false }: NavButtonProps) => (
  <button
    type="button"
    onClick={onClick}
    title={collapsed ? label : undefined}
    className={navItemClass(collapsed)}
  >
    <Icon className="size-4 shrink-0" />
    <NavLabel label={label} collapsed={collapsed} />
  </button>
)

const ThemeToggleItem = ({ collapsed }: { collapsed: boolean }) => {
  const toggleTheme = useThemeToggle()

  return <NavButton icon={ThemeIcon} label="Alterar tema" onClick={toggleTheme} collapsed={collapsed} />
}

const LoggoutToggleItem = ({ collapsed }: { collapsed: boolean }) => {
  const logout = useLogout()

  return <NavButton icon={HiOutlineLogout} label="Loggout" onClick={logout} collapsed={collapsed} />
}

type MenuNavProps = {
  collapsed?: boolean
  onNavigate?: () => void
  // sidebar: grupo de ajustes no rodapé · stacked: logo abaixo, após um <hr>
  variant?: 'sidebar' | 'stacked'
  // item extra no início do grupo de ajustes
  extraSettingsItem?: ReactNode
}

export const MenuNav = ({
  collapsed = false,
  onNavigate,
  variant = 'sidebar',
  extraSettingsItem,
}: MenuNavProps) => {
  const isSidebar = variant === 'sidebar'

  return (
    <nav
      aria-label="Menu principal"
      className={cn('flex flex-col gap-2', isSidebar && 'flex-1 overflow-y-auto')}
    >
      <ul className="flex flex-col gap-2">
        {mainNavItems.map((item) => (
          <li key={item.id}>
            <NavLink item={item} collapsed={collapsed} onNavigate={onNavigate} />
          </li>
        ))}
      </ul>

      {!isSidebar && <hr className="border-border" />}

      <ul className={cn('flex flex-col gap-2', isSidebar && 'mt-auto')}>
        {settingsNavItems.map((item) => (
          <li key={item.id}>
            <NavLink item={item} collapsed={collapsed} onNavigate={onNavigate} />
          </li>
        ))}
        <li>
          <ThemeToggleItem collapsed={collapsed} />
        </li>
        <li>
          <LoggoutToggleItem collapsed={collapsed} />
        </li>
        {extraSettingsItem && <li>{extraSettingsItem}</li>}
      </ul>
    </nav>
  )
}
