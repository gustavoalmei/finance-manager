import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import useEmblaCarousel from 'embla-carousel-react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '#/components/ui/button'
import { cn } from '#/lib/utils'

type SlideItem = {
  key: string
  title: string
  content: ReactNode
}

// Carrossel dentro de um card: um slide por vez, título do slide no topo.
// O carrossel de ui/ é feito para cartões (slides vizinhos visíveis); aqui não cabe.
type SlideCarouselProps = {
  slides: Array<SlideItem>
  // false no modo de edição: arrastar o card não pode trocar o slide
  swipeable: boolean
}

export const SlideCarousel = ({ slides, swipeable }: SlideCarouselProps) => {
  // o Embla reinicia sozinho quando as opções mudam
  const [viewportRef, api] = useEmblaCarousel({ watchDrag: swipeable })
  const [selected, setSelected] = useState(0)
  // escopo pode deixar um slide só: sem setas nem bolinhas
  const hasControls = slides.length > 1

  useEffect(() => {
    if (!api) return
    const onSelect = () => setSelected(api.selectedScrollSnap())
    onSelect()
    api.on('select', onSelect).on('reInit', onSelect)
    return () => {
      api.off('select', onSelect).off('reInit', onSelect)
    }
  }, [api])

  return (
    <div
      role="region"
      aria-roledescription="carrossel"
      aria-label="Indicadores"
      className="flex flex-col gap-3"
    >
      <div className="flex items-center gap-2">
        <h3
          className="min-w-0 flex-1 truncate text-base font-medium"
          aria-live="polite"
        >
          {slides[selected]?.title}
        </h3>
        {hasControls && (
          <>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Slide anterior"
              disabled={selected === 0}
              onClick={() => api?.scrollPrev()}
            >
              <ChevronLeft />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Próximo slide"
              disabled={selected === slides.length - 1}
              onClick={() => api?.scrollNext()}
            >
              <ChevronRight />
            </Button>
          </>
        )}
      </div>

      <div ref={viewportRef} className="overflow-hidden">
        <div className="flex touch-pan-y">
          {slides.map((slide, index) => (
            <div
              key={slide.key}
              role="group"
              aria-roledescription="slide"
              aria-label={`${index + 1} de ${slides.length}: ${slide.title}`}
              // inert: slides fora da tela não recebem foco
              inert={index !== selected}
              className="min-w-0 shrink-0 basis-full"
            >
              {slide.content}
            </div>
          ))}
        </div>
      </div>

      {hasControls && (
        <div className="flex justify-center gap-1.5">
          {slides.map((slide, index) => (
            <button
              key={slide.key}
              type="button"
              aria-label={`Ir para ${slide.title}`}
              aria-current={index === selected}
              onClick={() => api?.scrollTo(index)}
              className={cn(
                'h-2 cursor-pointer rounded-full transition-all',
                index === selected
                  ? 'w-6 bg-nav-active'
                  : 'w-2 bg-border-strong',
              )}
            />
          ))}
        </div>
      )}
    </div>
  )
}
