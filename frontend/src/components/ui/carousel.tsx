import { useCallback, useEffect, useRef, useState } from 'react'
import type { KeyboardEvent, ReactNode } from 'react'
import useEmblaCarousel from 'embla-carousel-react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '#/components/ui/button'
import { cn } from '#/lib/utils'

type CarouselProps<T> = {
  items: Array<T>
  getKey: (item: T) => string
  renderItem: (item: T, selected: boolean) => ReactNode
  // nome acessível do carrossel (ex.: "Cartões de crédito")
  label: string
  className?: string
  // largura do slide; ao passar, substitui o padrão inteiro (inclusive sm:)
  slideClassName?: string
  onSelectedChange?: (index: number) => void
}

export const Carousel = <T,>({
  items,
  getKey,
  renderItem,
  label,
  className,
  slideClassName = 'basis-[80%] sm:basis-[60%]',
  onSelectedChange,
}: CarouselProps<T>) => {
  const [viewportRef, api] = useEmblaCarousel({
    align: 'center',
    containScroll: false,
  })
  const [selectedIndex, setSelectedIndex] = useState(0)

  // ref: o listener do Embla sempre chama a versão mais recente do callback
  const onSelectedChangeRef = useRef(onSelectedChange)
  useEffect(() => {
    onSelectedChangeRef.current = onSelectedChange
  })

  useEffect(() => {
    if (!api) return
    const onSelect = () => {
      const index = api.selectedScrollSnap()
      setSelectedIndex(index)
      onSelectedChangeRef.current?.(index)
    }
    onSelect()
    api.on('select', onSelect).on('reInit', onSelect)
    return () => {
      api.off('select', onSelect).off('reInit', onSelect)
    }
  }, [api])

  const scrollPrev = useCallback(() => api?.scrollPrev(), [api])
  const scrollNext = useCallback(() => api?.scrollNext(), [api])

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'ArrowLeft') {
      event.preventDefault()
      scrollPrev()
    }
    if (event.key === 'ArrowRight') {
      event.preventDefault()
      scrollNext()
    }
  }

  // o Embla já bloqueia o click disparado ao soltar um arraste
  const handleSlideClick = (index: number) => api?.scrollTo(index)

  return (
    <div
      role="region"
      aria-roledescription="carrossel"
      aria-label={label}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      className={cn('flex flex-col gap-4 rounded-xl outline-none', className)}
    >
      {/* relative: botões nas laterais, centralizados com inset-y-0 + my-auto
          (translate brigaria com o active:translate-y-px do Button) */}
      <div className="relative">
        <Button
          variant="outline"
          size="icon"
          aria-label="Anterior"
          disabled={selectedIndex === 0}
          onClick={scrollPrev}
          className="absolute inset-y-0 left-0 z-20 my-auto rounded-full shadow-md"
        >
          <ChevronLeft />
        </Button>

        <div ref={viewportRef} className="overflow-hidden">
          {/* py: espaço para sombra e deslocamento dos slides não serem cortados pelo overflow */}
          <div className="flex touch-pan-y py-6">
            {items.map((item, index) => {
              const selected = index === selectedIndex

              return (
                <div
                  key={getKey(item)}
                  role="group"
                  aria-roledescription="slide"
                  aria-label={`${index + 1} de ${items.length}`}
                  onClick={() => handleSlideClick(index)}
                  className={cn(
                    'relative min-w-0 shrink-0 rounded-2xl border transition-[scale,opacity,translate] duration-300',
                    // translate (e não margem negativa): não altera o layout que o Embla mede
                    !selected &&
                    'z-0 cursor-pointer scale-80 translate-y-8 border-transparent opacity-50',
                    index < selectedIndex && 'translate-x-[20%]',
                    index > selectedIndex && 'translate-x-[-20%]',
                    selected && 'z-10 scale-100 border-border-ring',
                    slideClassName,
                  )}
                >
                  {renderItem(item, selected)}
                </div>
              )
            })}
          </div>
        </div>

        <Button
          variant="outline"
          size="icon"
          aria-label="Próximo"
          disabled={selectedIndex === items.length - 1}
          onClick={scrollNext}
          className="absolute inset-y-0 right-0 z-20 my-auto rounded-full shadow-md"
        >
          <ChevronRight />
        </Button>
      </div>

      <div className="flex flex-col items-center justify-center gap-3">
        <div className="flex gap-1.5">
          {items.map((item, index) => (
            <button
              key={getKey(item)}
              type="button"
              tabIndex={-1}
              aria-label={`Ir para ${index + 1}`}
              aria-current={index === selectedIndex}
              onClick={() => api?.scrollTo(index)}
              className={cn(
                'h-2 cursor-pointer rounded-full transition-all',
                index === selectedIndex
                  ? 'w-10 bg-nav-active'
                  : 'w-2 bg-border border-border-strong',
              )}
            />
          ))}
        </div>
        <span className="text-muted-foreground">
          {selectedIndex + 1} de {items.length}
        </span>
      </div>
    </div>
  )
}
