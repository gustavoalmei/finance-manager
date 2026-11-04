import * as React from "react"
import { cn } from "#/lib/utils"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex field-sizing-content min-h-16 w-full rounded-lg border border-input bg-item px-3 py-2 text-sm text-foreground transition-[color,border-color,box-shadow] outline-none placeholder:text-placeholder focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:bg-muted disabled:opacity-50 aria-invalid:border-destructive-text",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
