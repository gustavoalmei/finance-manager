import type { ReactNode } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, X } from 'lucide-react'
import { Button } from '#/components/ui/button'
import { Card } from '#/components/ui/card'
import type { ChartKind, ScopeKind, Widget, WidgetSize } from '#/lib/dashboard'
import { cn } from '#/lib/utils'
import {
  chartLabels,
  getWidgetIcon,
  getWidgetTitle,
  scopeNames,
  sizeLabels,
  widgetCatalog,
} from './widgets/catalog'

// colunas da grade: 1 (celular) · 2 (md) · 4 (xl)
export const sizeClasses: Record<WidgetSize, string> = {
  sm: 'col-span-1',
  md: 'md:col-span-2',
  lg: 'md:col-span-2 xl:col-span-4',
}

type OptionGroupProps<T extends string> = {
  label: string
  options: Array<T>
  value: T | undefined
  getLabel: (option: T) => string
  onChange: (option: T) => void
}

const OptionGroup = <T extends string>({
  label,
  options,
  value,
  getLabel,
  onChange,
}: OptionGroupProps<T>) => (
  <div
    role="group"
    aria-label={label}
    className="flex rounded-lg bg-muted p-0.5"
  >
    {options.map((option) => (
      <button
        key={option}
        type="button"
        aria-pressed={value === option}
        onClick={() => onChange(option)}
        className={cn(
          'h-6 cursor-pointer rounded-md px-2 text-xs font-medium text-muted-foreground',
          value === option && 'bg-nav-active text-nav-active-foreground',
        )}
      >
        {getLabel(option)}
      </button>
    ))}
  </div>
)

type WidgetFrameProps = {
  widget: Widget
  editing: boolean
  scope: ScopeKind
  // não se aplica ao escopo: só aparece (esmaecido) no modo de edição
  unavailable: boolean
  onChange: (widget: Widget) => void
  onRemove: () => void
  children: ReactNode
}

export const WidgetFrame = ({
  widget,
  editing,
  scope,
  unavailable,
  onChange,
  onRemove,
  children,
}: WidgetFrameProps) => {
  const definition = widgetCatalog[widget.type]
  const title = getWidgetTitle(widget.type, scope)
  const Icon = getWidgetIcon(widget.type, scope)
  // fora do modo de edição o card não arrasta (evita mover sem querer e brigar com a rolagem)
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: widget.id, disabled: !editing })
  // carrossel mostra o título do slide atual dentro do corpo
  const showTitle = widget.type !== 'carousel'

  return (
    <Card
      ref={setNodeRef}
      style={{
        // Translate (sem scale): cards de tamanhos diferentes não se deformam
        transform: CSS.Translate.toString(transform),
        transition,
      }}
      className={cn(
        'min-w-0 gap-3 border border-border bg-background',
        sizeClasses[widget.size],
        // leve elevação ao passar o mouse: o card parece "pegável"
        !editing && 'transition-shadow hover:shadow-md',
        editing && 'border-dashed border-border-strong',
        unavailable && 'opacity-50',
        isDragging && 'z-10 opacity-80 shadow-lg',
      )}
    >
      {(showTitle || editing) && (
        <header className="flex flex-wrap items-center gap-2 px-(--card-spacing)">
          {editing && (
            <button
              ref={setActivatorNodeRef}
              type="button"
              aria-label={`Mover ${title}`}
              className="cursor-grab touch-none rounded-md p-1 text-muted-foreground hover:bg-muted active:cursor-grabbing"
              {...attributes}
              {...listeners}
            >
              <GripVertical className="size-4" />
            </button>
          )}
          {(showTitle || unavailable) && (
            <>
              <span
                aria-hidden
                className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground"
              >
                <Icon className="size-4" />
              </span>
              <h3 className="min-w-0 flex-1 truncate text-base font-medium">
                {title}
              </h3>
            </>
          )}
          {unavailable && (
            <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
              Não se aplica a {scopeNames[scope]}
            </span>
          )}
          {!definition.usesPeriod && !editing && (
            <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
              Hoje
            </span>
          )}
          {editing && (
            <div className="ml-auto flex flex-wrap items-center gap-1.5">
              {definition.charts && (
                <OptionGroup<ChartKind>
                  label="Tipo de gráfico"
                  options={definition.charts}
                  value={widget.chart}
                  getLabel={(chart) => chartLabels[chart]}
                  onChange={(chart) => onChange({ ...widget, chart })}
                />
              )}
              {definition.sizes.length > 1 && (
                <OptionGroup<WidgetSize>
                  label="Tamanho"
                  options={definition.sizes}
                  value={widget.size}
                  getLabel={(size) => sizeLabels[size]}
                  onChange={(size) => onChange({ ...widget, size })}
                />
              )}
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={`Remover ${title}`}
                onClick={onRemove}
              >
                <X />
              </Button>
            </div>
          )}
        </header>
      )}
      <div className="flex flex-1 flex-col px-(--card-spacing)">{children}</div>
    </Card>
  )
}
