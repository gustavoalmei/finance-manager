import { useEffect, useState } from 'react'
import image1 from '#/assets/image-random.jpg'
import image2 from '#/assets/image-random2.jpg'
import image3 from '#/assets/image-random3.jpg'
import image4 from '#/assets/image-random4.jpg'
import image5 from '#/assets/image-random5.jpg'

const SLIDE_DURATION_MS = 8000

const slides = [
  { img: image1, description: 'Um momento simples que virou uma lembrança especial.' },
  { img: image2, description: 'Entre detalhes, luzes e perspectivas, cada imagem conta uma história diferente.' },
  { img: image3, description: 'Registros de momentos que merecem ser guardados e revisitados.' },
  { img: image4, description: 'Uma imagem capaz de transmitir aquilo que palavras nem sempre conseguem explicar.' },
  { img: image5, description: 'Pequenos detalhes, grandes memórias e uma perspectiva única de cada momento.' },
]

export const Carousel = () => {
  const [currentIndex, setCurrentIndex] = useState(0)
  const slide = slides[currentIndex]

  // depende do índice para reiniciar o tempo ao trocar manualmente
  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % slides.length)
    }, SLIDE_DURATION_MS)

    return () => clearTimeout(timer)
  }, [currentIndex])

  return (
    <div className="relative h-full w-full">
      <img className="h-full w-full object-cover" src={slide.img} alt={slide.description} />

      <div className="absolute bottom-0 left-0 flex w-full flex-col gap-2 bg-black/50 p-3 drop-shadow-xl/50">
        <p className="p-2 text-white">{slide.description}</p>

        <div className="flex w-full gap-2 py-1">
          {slides.map((_, index) => (
            <button
              key={index}
              type="button"
              aria-label={`Ir para imagem ${index + 1}`}
              aria-current={index === currentIndex}
              onClick={() => setCurrentIndex(index)}
              className="relative h-1.5 w-full cursor-pointer overflow-hidden rounded-full bg-white/30"
            >
              {index === currentIndex && (
                <span
                  className="absolute inset-y-0 left-0 animate-[progress-fill_linear_forwards] rounded-full bg-background"
                  // mesma duração do timer, sem repetir o valor no CSS
                  style={{ animationDuration: `${SLIDE_DURATION_MS}ms` }}
                />
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
