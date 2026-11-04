import { useState } from 'react'
import { MenuIcon, XIcon } from 'lucide-react'
import { Button } from '#/components/ui/button'
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from '#/components/ui/sheet'
import { useBreakpointChange } from '#/hooks/use-breakpoint-change'
import { cn } from '#/lib/utils'
import { LogoBar } from './logo-bar'
import { MenuNav } from './menu-nav'

type MobileMenuProps = {
  // trigger e painel ficam em lugares diferentes do DOM (portal)
  classNames?: {
    trigger?: string
    content?: string
    header?: string
  }
}

export const MobileMenu = ({ classNames }: MobileMenuProps) => {
  // controlado para fechar ao navegar
  const [open, setOpen] = useState(false)
  // o menu só existe no mobile: ao virar desktop, fecha
  useBreakpointChange(() => setOpen(false))

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={
          <Button
            variant="ghost"
            size="icon-lg"
            aria-label="Abrir menu"
            className={classNames?.trigger}
          />
        }
      >
        <MenuIcon className="size-6" />
      </SheetTrigger>

      <SheetContent
        side="top"
        className={cn('rounded-b-panel', classNames?.content)}
      >
        <SheetTitle>Menu</SheetTitle>

        <LogoBar
          className={classNames?.header}
          logoClassName="h-12"
          end={
            <SheetClose
              render={
                <Button
                  variant="ghost"
                  size="icon-lg"
                  aria-label="Fechar menu"
                />
              }
            >
              <XIcon className="size-5" />
            </SheetClose>
          }
        />

        <MenuNav variant="stacked" onNavigate={() => setOpen(false)} />
      </SheetContent>
    </Sheet>
  )
}
