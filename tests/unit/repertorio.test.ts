import { describe, expect, it } from 'vitest'

import { IMMAGINI_SCUOLE } from '@/lib/immagini-scuole'
import { immagineDiRepertorio, REPERTORIO } from '@/lib/repertorio'

describe('immagine di repertorio', () => {
  it('usa la foto della scuola quando c’è', () => {
    expect(immagineDiRepertorio('un-avviso', ['pittura'])).toBe(IMMAGINI_SCUOLE.pittura)
  })

  it('senza scuola sceglie una foto delle sedi, sempre la stessa per lo stesso avviso', () => {
    const a = immagineDiRepertorio('bando-erasmus-2026')
    expect(REPERTORIO).toContain(a)
    expect(immagineDiRepertorio('bando-erasmus-2026')).toBe(a)
  })
})

describe('repertorio e home', () => {
  it('scalone e pinacoteca non finiscono nello slider: fanno da sfondo alla home', async () => {
    const pinacoteca = (await import('@/assets/repertorio/pinacoteca.webp')).default
    const scalone = (await import('@/assets/repertorio/scalone.webp')).default
    expect(REPERTORIO).not.toContain(pinacoteca)
    expect(REPERTORIO).not.toContain(scalone)
  })
})
