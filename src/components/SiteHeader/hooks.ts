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

/** Pixel da scorrere prima che l'header possa nascondersi. */
const SOGLIA = 200
/** Movimenti più piccoli vengono ignorati (tremolio del trackpad). */
const TOLLERANZA = 8

/**
 * Header che si nasconde scorrendo in giù e ricompare scorrendo in su.
 * Restituisce lo stato e una funzione per farlo ricomparire (es. quando riceve il focus).
 */
export function useNascondiScorrendo(): [boolean, () => void] {
  const [nascosto, setNascosto] = useState(false)

  useEffect(() => {
    let ultimo = window.scrollY
    let inAttesa = false
    const onScroll = () => {
      if (inAttesa) return
      inAttesa = true
      requestAnimationFrame(() => {
        const y = window.scrollY
        const delta = y - ultimo
        if (Math.abs(delta) > TOLLERANZA) {
          setNascosto(delta > 0 && y > SOGLIA)
          ultimo = y
        }
        inAttesa = false
      })
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return [nascosto, () => setNascosto(false)]
}
