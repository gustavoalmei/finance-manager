import type { ReactNode } from 'react'
import { Logo } from '#/components/icons/logo'
import { cn } from '#/lib/utils'

type LogoBarProps = {
  start?: ReactNode
  end?: ReactNode
  className?: string
  logoClassName?: string
}

// Colunas laterais iguais (1fr) mantêm o logo no centro real
export const LogoBar = ({ start, end, className, logoClassName }: LogoBarProps) => (
  <div className={cn('grid grid-cols-[1fr_auto_1fr] items-center', className)}>
    <div className="justify-self-start">{start}</div>
    <Logo className={cn('h-10 w-auto', logoClassName)} />
    <div className="justify-self-end">{end}</div>
  </div>
)
