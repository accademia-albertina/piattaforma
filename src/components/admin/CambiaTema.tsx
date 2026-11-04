'use client'

import { useTheme } from '@payloadcms/ui'
import { Moon, Sun } from 'lucide-react'

/** Pulsante nell'intestazione del pannello: passa dal tema chiaro a quello scuro e viceversa. */
export default function CambiaTema() {
  const { theme, setTheme } = useTheme()
  const scuro = theme === 'dark'
  const etichetta = scuro ? 'Passa al tema chiaro' : 'Passa al tema scuro'
  return (
    <button
      type="button"
      className="cambia-tema"
      aria-label={etichetta}
      title={etichetta}
      onClick={() => setTheme(scuro ? 'light' : 'dark')}
    >
      {scuro ? (
        <Sun size={20} strokeWidth={1.5} aria-hidden />
      ) : (
        <Moon size={20} strokeWidth={1.5} aria-hidden />
      )}
    </button>
  )
}
