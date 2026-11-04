import type { ReactNode } from 'react'

// Usuário tem dados, mas não neste período (ou não deste tipo)
export const WidgetEmpty = ({ children }: { children: ReactNode }) => (
  <p className="flex min-h-24 flex-1 items-center justify-center px-2 text-center text-sm text-muted-foreground">
    {children}
  </p>
)
