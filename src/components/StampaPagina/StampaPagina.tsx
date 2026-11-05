'use client'

import { Printer } from 'lucide-react'

import { Button } from '../Button/Button'

/** Pulsante “Stampa”: apre la stampa del browser (da lì si salva anche in PDF). */
export function StampaPagina({ label = 'Stampa' }: { label?: string }) {
  return (
    <Button variant="secondary" onPress={() => window.print()} className="non-stampare">
      <Printer size={18} strokeWidth={1.75} aria-hidden /> {label}
    </Button>
  )
}
