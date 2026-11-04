import type { ReactNode } from "react"
import { Label } from "#/components/ui/label"
import { cn } from "#/lib/utils"

type FormFieldProps = {
  // id do campo: liga o <label> ao controle
  htmlFor: string
  label: string
  hint?: string
  // mensagem de erro: substitui o hint enquanto existir
  error?: string
  className?: string
  children: ReactNode
}

export const FormField = ({ htmlFor, label, hint, error, className, children }: FormFieldProps) => (
  <div className={cn("flex flex-col gap-1.5", className)}>
    <Label htmlFor={htmlFor}>{label}</Label>
    {children}
    {error ? (
      <small role="alert" className="text-[11px] text-destructive-text">
        {error}
      </small>
    ) : (
      hint && <small className="text-[11px] text-muted-foreground">{hint}</small>
    )}
  </div>
)
