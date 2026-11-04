import type { ComponentType, SVGProps } from 'react'
import type { LinkProps } from '@tanstack/react-router'
import { Settings } from 'lucide-react'
import { IconeMenu } from '#/components/icons/icone-menu'
import { FaCreditCard } from 'react-icons/fa6'
import { MdAccountCircle } from 'react-icons/md'
import { BiCategory } from 'react-icons/bi'
import { GrTransaction } from 'react-icons/gr'

export type NavItem = {
  id: string
  label: string
  icon: ComponentType<SVGProps<SVGSVGElement>>
  // sem `to`: item desabilitado até a rota existir
  to?: LinkProps['to']
}

export const mainNavItems: Array<NavItem> = [
  { id: 'inicio', label: 'Início', icon: IconeMenu, to: '/' },
  { id: 'accounts', label: 'Contas', icon: MdAccountCircle, to: '/accounts' },
  {
    id: 'credit-card',
    label: 'Cartão',
    icon: FaCreditCard,
    to: '/credit-card',
  },
  {
    id: 'categories',
    label: 'Categorias',
    icon: BiCategory,
    to: '/categories',
  },
  {
    id: 'transactions',
    label: 'Transações',
    icon: GrTransaction,
    to: '/transactions',
  },
]

export const settingsNavItems: Array<NavItem> = [
  {
    id: 'configuracoes',
    label: 'Configurações',
    icon: Settings,
    to: '/configuracoes',
  },
]
