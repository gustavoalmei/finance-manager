import { useEffect, useState } from 'react'

// try/catch: localStorage lança em modo privado (Safari) ou com cota cheia
const readStorage = (key: string) => {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

const writeStorage = (key: string, value: string | null) => {
  try {
    if (value === null) localStorage.removeItem(key)
    else localStorage.setItem(key, value)
  } catch {
    // sem persistência: a seleção continua funcionando só em memória
  }
}

// Id salvo no localStorage. Lido só após montar: no SSR não existe localStorage,
// e ler no 1º render faria o HTML do servidor divergir do cliente (hydration).
export const usePersistedId = (key: string) => {
  const [value, setValue] = useState<string | null>(null)
  // false até ler o storage: null antes disso não significa "nada salvo"
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    setValue(readStorage(key))
    setIsLoaded(true)
  }, [key])

  const update = (next: string | null) => {
    setValue(next)
    writeStorage(key, next)
  }

  return [value, update, isLoaded] as const
}
