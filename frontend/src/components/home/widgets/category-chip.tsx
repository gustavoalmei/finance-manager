import { categoryColorVar, getCategoryIcon } from '#/lib/categories'
import { cn } from '#/lib/utils'

// Ícone da categoria num quadrado com fundo suave da própria cor
export const CategoryChip = ({
  color,
  icon,
  className,
}: {
  color: string
  icon: string
  className?: string
}) => {
  const Icon = getCategoryIcon(icon)
  const tone = categoryColorVar(color)

  return (
    <span
      aria-hidden
      className={cn(
        'flex size-9 shrink-0 items-center justify-center rounded-xl',
        className,
      )}
      style={{ background: `color-mix(in srgb, ${tone} 16%, transparent)` }}
    >
      <Icon className="size-4" style={{ color: tone }} />
    </span>
  )
}
