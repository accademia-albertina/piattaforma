'use client'

import { Eye, EyeOff } from 'lucide-react'
import { useEffect, useState } from 'react'

/** Con Google attivo, la password serve solo agli admin (emergenza) e agli account di prova. */
export function passwordUtile(
  soloGoogle: boolean,
  ruoli: unknown,
  accountDiProva: unknown,
): boolean {
  if (!soloGoogle) return true
  return (Array.isArray(ruoli) && ruoli.includes('admin')) || accountDiProva === true
}

/** Pulsante a occhio che mostra o nasconde quanto scritto in un campo password. */
export function MostraPassword({ input }: { input: HTMLInputElement }) {
  const [visibile, setVisibile] = useState(false)
  useEffect(() => {
    input.setAttribute('type', visibile ? 'text' : 'password')
  }, [input, visibile])
  return (
    <button
      type="button"
      className="mostra-password"
      aria-label={visibile ? 'Nascondi la password' : 'Mostra la password'}
      aria-pressed={visibile}
      aria-controls={input.id}
      onClick={() => setVisibile(!visibile)}
    >
      {visibile ? (
        <EyeOff size={20} strokeWidth={1.5} aria-hidden />
      ) : (
        <Eye size={20} strokeWidth={1.5} aria-hidden />
      )}
    </button>
  )
}
