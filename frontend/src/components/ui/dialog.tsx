import { Dialog as DialogPrimitive } from "@base-ui/react/dialog"
import type { ComponentProps } from "react"
import { cn } from "#/lib/utils"
import { SheetHandle } from "./sheet"

const Dialog = (props: DialogPrimitive.Root.Props) => (
  <DialogPrimitive.Root data-slot="dialog" {...props} />
)

const DialogClose = (props: DialogPrimitive.Close.Props) => (
  <DialogPrimitive.Close data-slot="dialog-close" {...props} />
)

// Popup/Backdrop/Title/Description são as mesmas partes no AlertDialog do Base UI.
// Mobile: painel de baixo (mesmo visual do Sheet bottom) · desktop: centralizado
const DialogContent = ({ className, children, ...props }: DialogPrimitive.Popup.Props) => (
  <DialogPrimitive.Portal>
    <DialogPrimitive.Backdrop
      data-slot="dialog-backdrop"
      className="fixed inset-0 z-50 bg-black/40 duration-200 data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0"
    />
    <DialogPrimitive.Popup
      data-slot="dialog-content"
      className={cn(
        "fixed z-50 flex flex-col gap-5 overflow-y-auto bg-card p-6 text-foreground shadow-xl ring-1 ring-foreground/10 outline-none",
        "max-md:inset-x-0 max-md:bottom-0 max-md:max-h-[85svh] max-md:rounded-t-panel max-md:pt-4 max-md:pb-[max(1.5rem,env(safe-area-inset-bottom))]",
        "md:top-1/2 md:left-1/2 md:w-[calc(100vw-2rem)] md:max-w-md md:-translate-x-1/2 md:-translate-y-1/2 md:rounded-panel",
        "duration-200 data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0",
        "max-md:data-open:slide-in-from-bottom max-md:data-closed:slide-out-to-bottom md:data-open:zoom-in-95 md:data-closed:zoom-out-95",
        className,
      )}
      {...props}
    >
      <SheetHandle className="md:hidden" />
      {children}
    </DialogPrimitive.Popup>
  </DialogPrimitive.Portal>
)

const DialogHeader = ({ className, ...props }: ComponentProps<"div">) => (
  <div data-slot="dialog-header" className={cn("flex flex-col gap-1.5", className)} {...props} />
)

const DialogFooter = ({ className, ...props }: ComponentProps<"div">) => (
  <div
    data-slot="dialog-footer"
    // botões lado a lado dividindo a largura toda
    className={cn("flex gap-2 *:flex-1", className)}
    {...props}
  />
)

const DialogTitle = ({ className, ...props }: DialogPrimitive.Title.Props) => (
  <DialogPrimitive.Title
    data-slot="dialog-title"
    className={cn("text-lg font-bold", className)}
    {...props}
  />
)

const DialogDescription = ({ className, ...props }: DialogPrimitive.Description.Props) => (
  <DialogPrimitive.Description
    data-slot="dialog-description"
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
)

export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
}
