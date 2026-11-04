import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import type { DragEndEvent } from '@dnd-kit/core'
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable'
import { Skeleton } from '#/components/ui/skeleton'
import type { DashboardSummary, ScopeKind, Widget } from '#/lib/dashboard'
import { cn } from '#/lib/utils'
import { WidgetFrame } from './widget-frame'
import { isWidgetAvailable, widgetCatalog } from './widgets/catalog'

export const gridClass = 'grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4'

type WidgetGridProps = {
  widgets: Array<Widget>
  summary: DashboardSummary | undefined
  // período trocado: números antigos esmaecidos até os novos chegarem
  isRefreshing: boolean
  editing: boolean
  scope: ScopeKind
  onChange: (widgets: Array<Widget>) => void
}

export const WidgetGrid = ({
  widgets,
  summary,
  isRefreshing,
  editing,
  scope,
  onChange,
}: WidgetGridProps) => {
  // fora do modo de edição, os que não se aplicam somem sem sair do layout;
  // na edição aparecem esmaecidos para manter a ordem reorganizável
  const visible = editing
    ? widgets
    : widgets.filter((widget) => isWidgetAvailable(widget, scope))
  const sensors = useSensors(
    // 5px de tolerância: clicar nos botões do card não inicia o arraste
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    // teclado: espaço pega, setas movem, espaço solta
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return
    const from = widgets.findIndex((widget) => widget.id === active.id)
    const to = widgets.findIndex((widget) => widget.id === over.id)
    onChange(arrayMove(widgets, from, to))
  }

  const replace = (next: Widget) =>
    onChange(widgets.map((widget) => (widget.id === next.id ? next : widget)))

  const remove = (id: string) =>
    onChange(widgets.filter((widget) => widget.id !== id))

  return (
    // id fixo: evita ids diferentes entre SSR e cliente nos atributos de acessibilidade
    <DndContext
      id="dashboard-widgets"
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={visible.map((widget) => widget.id)}
        strategy={rectSortingStrategy}
      >
        <div
          aria-busy={isRefreshing}
          className={cn(
            gridClass,
            'transition-opacity',
            isRefreshing && 'opacity-60',
          )}
        >
          {visible.map((widget) => {
            const unavailable = !isWidgetAvailable(widget, scope)

            return (
              <WidgetFrame
                key={widget.id}
                widget={widget}
                editing={editing}
                scope={scope}
                unavailable={unavailable}
                onChange={replace}
                onRemove={() => remove(widget.id)}
              >
                {unavailable ? null : summary ? (
                  widgetCatalog[widget.type].render({
                    summary,
                    chart: widget.chart,
                    slides: widget.slides,
                    editing,
                    scope,
                  })
                ) : (
                  <div className="flex flex-col gap-2">
                    <Skeleton className="h-7 w-2/3" />
                    <Skeleton className="h-4 w-1/2" />
                    {widget.size !== 'sm' && (
                      <Skeleton className="h-40 w-full" />
                    )}
                  </div>
                )}
              </WidgetFrame>
            )
          })}
        </div>
      </SortableContext>
    </DndContext>
  )
}
