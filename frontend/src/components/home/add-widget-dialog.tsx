import { useState } from 'react'
import { Check } from 'lucide-react'
import { Button } from '#/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '#/components/ui/dialog'
import type { DialogRootProps } from '#/hooks/use-dialog-state'
import type { SlideType, Widget, WidgetType } from '#/lib/dashboard'
import { cn } from '#/lib/utils'
import {
  availabilityLabel,
  createWidget,
  slideTypes,
  widgetCatalog,
} from './widgets/catalog'

const MIN_SLIDES = 2

const widgetTypes = Object.keys(widgetCatalog) as Array<WidgetType>

const optionClass = (selected: boolean) =>
  cn(
    'flex w-full cursor-pointer items-start gap-3 rounded-lg border border-border p-3 text-left transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50',
    selected && 'border-ring bg-muted',
  )

type AddWidgetFormProps = {
  widgets: Array<Widget>
  onAdd: (widget: Widget) => void
}

// Montado só com o modal aberto: a escolha começa sempre vazia
const AddWidgetForm = ({ widgets, onAdd }: AddWidgetFormProps) => {
  const [type, setType] = useState<WidgetType | null>(null)
  const [slides, setSlides] = useState<Array<SlideType>>([])
  const present = new Set(widgets.map((widget) => widget.type))

  const toggleSlide = (slide: SlideType) =>
    setSlides((current) =>
      current.includes(slide)
        ? current.filter((item) => item !== slide)
        : [...current, slide],
    )

  const canAdd =
    type !== null && (type !== 'carousel' || slides.length >= MIN_SLIDES)

  return (
    // só a lista rola: título e botões ficam sempre visíveis
    <div className="flex min-h-0 flex-1 flex-col gap-4">
      <div className="-mx-1 flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-1">
        <ul className="flex flex-col gap-2">
          {widgetTypes.map((option) => {
            const definition = widgetCatalog[option]
            const alreadyAdded = definition.unique && present.has(option)

            return (
              <li key={option}>
                <button
                  type="button"
                  aria-pressed={type === option}
                  disabled={alreadyAdded}
                  onClick={() => setType(option)}
                  className={optionClass(type === option)}
                >
                  <span className="flex flex-1 flex-col gap-0.5">
                    <span className="text-sm font-medium">
                      {definition.title}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {alreadyAdded
                        ? 'Já está na tela'
                        : definition.description}
                    </span>
                    {!alreadyAdded && availabilityLabel(option) && (
                      <span className="text-xs font-medium text-muted-foreground">
                        {availabilityLabel(option)}
                      </span>
                    )}
                  </span>
                  {type === option && <Check className="size-4 shrink-0" />}
                </button>
              </li>
            )
          })}
        </ul>

        {type === 'carousel' && (
          <fieldset
            // os slides aparecem no fim da lista: rola até eles ao escolher o carrossel
            ref={(node) =>
              node?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
            }
            className="flex flex-col gap-2"
          >
            <legend className="mb-2 text-sm font-medium">
              Slides do carrossel (na ordem escolhida, mínimo {MIN_SLIDES})
            </legend>
            {slideTypes.map((slide) => {
              const position = slides.indexOf(slide)

              return (
                <button
                  key={slide}
                  type="button"
                  aria-pressed={position >= 0}
                  onClick={() => toggleSlide(slide)}
                  className={optionClass(position >= 0)}
                >
                  <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold tabular-nums">
                    {position >= 0 ? position + 1 : ''}
                  </span>
                  <span className="flex-1 text-sm">
                    {widgetCatalog[slide].title}
                  </span>
                </button>
              )
            })}
          </fieldset>
        )}
      </div>

      <DialogFooter>
        <DialogClose render={<Button type="button" variant="outline" />}>
          Cancelar
        </DialogClose>
        <Button
          type="button"
          disabled={!canAdd}
          onClick={() =>
            type &&
            onAdd(createWidget(type, type === 'carousel' ? slides : undefined))
          }
          className="bg-nav-active text-nav-active-foreground"
        >
          Adicionar
        </Button>
      </DialogFooter>
    </div>
  )
}

type AddWidgetDialogProps = DialogRootProps & AddWidgetFormProps

export const AddWidgetDialog = ({
  widgets,
  onAdd,
  ...rootProps
}: AddWidgetDialogProps) => (
  <Dialog {...rootProps}>
    {/* altura máxima também no desktop (o padrão só limita no celular) */}
    <DialogContent className="overflow-hidden md:max-h-[85svh]">
      <DialogHeader>
        <DialogTitle>Adicionar card</DialogTitle>
        <DialogDescription>
          Escolha o indicador. Ele entra no fim da tela e pode ser movido
          depois.
        </DialogDescription>
      </DialogHeader>

      <AddWidgetForm widgets={widgets} onAdd={onAdd} />
    </DialogContent>
  </Dialog>
)
