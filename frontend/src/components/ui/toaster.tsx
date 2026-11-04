import { Toaster as HotToaster } from "react-hot-toast"
import type { ToasterProps } from "react-hot-toast"
import { toasterConfig } from "@/lib/toaster"

/**
 * Monta o toaster da aplicação. Deve ficar uma única vez no layout raiz
 * (`__root.tsx`). A config (posição, cores, duração) vive em `@/lib/toaster`.
 *
 * Para disparar toasts a partir de qualquer componente, use o serviço
 * `toaster` de `@/lib/toaster` — não importe `react-hot-toast` direto.
 */
export const Toaster = (props: ToasterProps) => {
  return <HotToaster {...toasterConfig} {...props} />
}
