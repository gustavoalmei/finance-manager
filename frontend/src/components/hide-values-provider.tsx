import { createContext, useContext, useEffect, useState } from 'react'
import type { ReactNode } from 'react'

// Por dispositivo (localStorage), como o tema: esconder no celular em público
// não precisa esconder no computador de casa. A chave é a mesma do script
// de __root.tsx, que aplica a classe antes da hidratação.
export const HIDE_VALUES_STORAGE_KEY = 'finance-manager-hide-values'

type HideValuesState = {
  hidden: boolean
  setHidden: (hidden: boolean) => void
}

const HideValuesContext = createContext<HideValuesState>({
  hidden: false,
  setHidden: () => null,
})

export const HideValuesProvider = ({ children }: { children: ReactNode }) => {
  const [hidden, setHidden] = useState(() => {
    if (typeof window === 'undefined') return false
    return localStorage.getItem(HIDE_VALUES_STORAGE_KEY) === 'true'
  })

  // classe no <html>: o CSS borra todo elemento marcado com .sensitive
  useEffect(() => {
    document.documentElement.classList.toggle('hide-values', hidden)
  }, [hidden])

  const value: HideValuesState = {
    hidden,
    setHidden: (next) => {
      localStorage.setItem(HIDE_VALUES_STORAGE_KEY, String(next))
      setHidden(next)
    },
  }

  return (
    <HideValuesContext.Provider value={value}>
      {children}
    </HideValuesContext.Provider>
  )
}

export const useHideValues = () => useContext(HideValuesContext)
