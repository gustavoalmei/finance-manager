import { Dialog as SheetPrimitive } from '@base-ui/react/dialog'
import type { ComponentProps } from 'react'
import { cn } from '#/lib/utils'

// Painel lateral sobre o Dialog do Base UI: foco preso, Esc/clique fora fecham
// e o scroll da página trava enquanto está aberto.
const Sheet = (props: SheetPrimitive.Root.Props) => (
  <SheetPrimitive.Root data-slot="sheet" {...props} />
)

const SheetTrigger = (props: SheetPrimitive.Trigger.Props) => (
  <SheetPrimitive.Trigger data-slot="sheet-trigger" {...props} />
)

const SheetClose = (props: SheetPrimitive.Close.Props) => (
  <SheetPrimitive.Close data-slot="sheet-close" {...props} />
)

const SheetTitle = ({ className, ...props }: SheetPrimitive.Title.Props) => (
  <SheetPrimitive.Title data-slot="sheet-title" className={cn('sr-only', className)} {...props} />
)

// Posição, tamanho e animação de cada lado ficam juntos para não haver
// conflito (ex.: duas animações de slide somadas viram um movimento diagonal).
const sideClasses = {
  left: 'inset-y-0 left-0 h-full w-3/4 max-w-sm border-r data-open:slide-in-from-left data-closed:slide-out-to-left',
  top: 'inset-x-0 top-0 max-h-svh border-b data-open:slide-in-from-top data-closed:slide-out-to-top',
  // safe-area: não fica sob a barra de gestos do iPhone
  bottom:
    'inset-x-0 bottom-0 max-h-[85svh] rounded-t-panel border-t pb-[max(1.25rem,env(safe-area-inset-bottom))] data-open:slide-in-from-bottom data-closed:slide-out-to-bottom',
}

// Alça do painel de baixo: indica que ele pode ser fechado
const SheetHandle = ({ className }: { className?: string }) => (
  <span aria-hidden="true" className={cn('mx-auto h-1 w-10 shrink-0 rounded-full bg-border', className)} />
)

type SheetContentProps = SheetPrimitive.Popup.Props &
  ComponentProps<'div'> & {
    side?: keyof typeof sideClasses
  }

const SheetContent = ({ className, children, side = 'left', ...props }: SheetContentProps) => (
  <SheetPrimitive.Portal>
    <SheetPrimitive.Backdrop
      data-slot="sheet-backdrop"
      className="fixed inset-0 z-50 bg-black/40 duration-200 data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0"
    />
    <SheetPrimitive.Popup
      data-slot="sheet-content"
      data-side={side}
      className={cn(
        'fixed z-50 flex flex-col gap-6 overflow-y-auto border-border bg-card p-5 text-foreground shadow-lg outline-none',
        'duration-200 data-open:animate-in data-closed:animate-out',
        sideClasses[side],
        className,
      )}
      {...props}
    >
      {children}
    </SheetPrimitive.Popup>
  </SheetPrimitive.Portal>
)

export { Sheet, SheetTrigger, SheetClose, SheetContent, SheetTitle, SheetHandle }
