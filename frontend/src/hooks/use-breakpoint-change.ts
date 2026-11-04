import { useEffect, useRef } from 'react'

// Mesmo valor do breakpoint `md` do Tailwind v4 (48rem = 768px)
const MD_QUERY = '(min-width: 48rem)'

// Chama `onChange` quando a tela cruza o breakpoint md (nos dois sentidos).
// Uso: fechar overlays de um layout que o CSS (md:hidden) acabou de esconder.
export const useBreakpointChange = (onChange: () => void) => {
  // ref: o listener chama sempre a versão mais recente do callback
  const onChangeRef = useRef(onChange)
  useEffect(() => {
    onChangeRef.current = onChange
  })

  useEffect(() => {
    const media = window.matchMedia(MD_QUERY)
    const handleChange = () => onChangeRef.current()
    media.addEventListener('change', handleChange)
    return () => media.removeEventListener('change', handleChange)
  }, [])
}
