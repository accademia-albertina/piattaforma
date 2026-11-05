import { useCallback, useEffect, useState, useSyncExternalStore } from 'react'

// Ambienti senza matchMedia (es. jsdom nei test) usano il valore del server.
const supportato = () => typeof window.matchMedia === 'function'

/**
 * Vero quando la media query è soddisfatta. Sul server (e al primo render del client)
 * vale `serverValue`, così l'idratazione non va in conflitto.
 */
export function useMediaQuery(query: string, serverValue: boolean): boolean {
  const subscribe = useCallback(
    (onChange: () => void) => {
      if (!supportato()) return () => {}
      const mql = window.matchMedia(query)
      mql.addEventListener('change', onChange)
      return () => mql.removeEventListener('change', onChange)
    },
    [query],
  )
  return useSyncExternalStore(
    subscribe,
    () => (supportato() ? window.matchMedia(query).matches : serverValue),
    () => serverValue,
  )
}

/**
 * Pixel da scorrere prima che la barra rossa diventi compatta, e sotto cui torna normale.
 * Entrambe oltre la barra dei servizi (36px): la barra rossa è già attaccata in alto e
 * spostarla in su non scopre spazio vuoto sotto.
 */
const SOGLIA = 72
const RITORNO = 44

/**
 * Vero quando la pagina è stata scorsa oltre la soglia: l'header si fa più basso
 * (logo più piccolo, meno spazio) con una transizione.
 */
export function useCompatto(): boolean {
  const [compatto, setCompatto] = useState(false)

  useEffect(() => {
    let inAttesa = false
    const aggiorna = () => {
      inAttesa = false
      // Isteresi: evita lo sfarfallio quando ci si ferma proprio sulla soglia
      setCompatto((prima) => (prima ? window.scrollY > RITORNO : window.scrollY > SOGLIA))
    }
    const onScroll = () => {
      if (inAttesa) return
      inAttesa = true
      requestAnimationFrame(aggiorna)
    }
    aggiorna()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return compatto
}
