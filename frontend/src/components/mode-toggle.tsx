import { Moon, Sun } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useThemeToggle } from "#/hooks/use-theme-toggle"
import { cn } from "#/lib/utils"

// Troca via CSS (dark:) para não divergir entre SSR e cliente
export const ThemeIcon = ({ className }: { className?: string }) => (
  <span aria-hidden="true" className={cn("relative inline-flex size-4 shrink-0", className)}>
    <Sun className="size-full scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" />
    <Moon className="absolute inset-0 size-full scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0" />
  </span>
)

export function ModeToggle() {
  const toggleTheme = useThemeToggle()

  return (
    <Button variant="outline" size="icon" onClick={toggleTheme}>
      <ThemeIcon />
      <span className="sr-only">Alternar tema</span>
    </Button>
  )
}
