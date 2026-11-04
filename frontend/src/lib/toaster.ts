import toast from "react-hot-toast"
import type { ToasterProps, ToastOptions } from "react-hot-toast"
import { getErrorMessage } from "@/lib/errors"

type PromiseMessages<Data> = {
  loading: string
  success: string | ((data: Data) => string)
  error?: string | ((error: unknown) => string)
}

/**
 * Config visual do toaster (posição, duração, cores). Usada pelo
 * `<Toaster />` em `@/components/ui/toaster` — mude aqui, não lá.
 * As cores usam os tokens do shadcn, então já seguem o tema claro/escuro.
 */
export const toasterConfig: ToasterProps = {
  position: "top-right",
  gutter: 8,
  toastOptions: {
    duration: 4000,
    style: {
      background: "var(--popover)",
      color: "var(--popover-foreground)",
      border: "1px solid var(--border)",
      boxShadow: "var(--shadow-md, 0 4px 12px rgb(0 0 0 / 0.08))",
      padding: "0.75rem 1rem",
      fontSize: "0.875rem",
    },
    success: {
      iconTheme: { primary: "var(--chart-2, #22c55e)", secondary: "var(--popover)" },
    },
    error: {
      iconTheme: { primary: "var(--destructive)", secondary: "var(--popover)" },
    },
  },
}

/** Serviço padrão de notificações. Evita importar `react-hot-toast` direto nas telas. */
class ToastService {
  success(message: string, options?: ToastOptions) {
    return toast.success(message, options)
  }

  /** Aceita a mensagem pronta ou o erro cru (AxiosError, Error, etc). */
  error(error: unknown, options?: ToastOptions) {
    const message = typeof error === "string" ? error : getErrorMessage(error)
    return toast.error(message, options)
  }

  warning(message: string, options?: ToastOptions) {
    return toast(message, { icon: "⚠️", ...options })
  }

  info(message: string, options?: ToastOptions) {
    return toast(message, { icon: "ℹ️", ...options })
  }

  loading(message: string, options?: ToastOptions) {
    return toast.loading(message, options)
  }

  /** Alterna loading -> success/error automaticamente. Ideal para chamadas de API. */
  promise<Data>(promise: Promise<Data>, messages: PromiseMessages<Data>) {
    return toast.promise(promise, {
      loading: messages.loading,
      success: messages.success,
      error: messages.error ?? ((error: unknown) => getErrorMessage(error)),
    })
  }

  dismiss(id?: string) {
    toast.dismiss(id)
  }
}

export const toaster = new ToastService()
