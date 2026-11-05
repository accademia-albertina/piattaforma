import { describe, expect, it } from 'vitest'

import { altDaNomeFile } from '@/utilities/testoAlternativo'

describe('testo alternativo', () => {
  it('dal nome del file toglie estensione, trattini e suffissi di WordPress', () => {
    expect(altDaNomeFile('Locandina_Open-Day 2026.jpg')).toBe('Locandina open day 2026')
    expect(altDaNomeFile('mostra-finale-scaled.webp')).toBe('Mostra finale')
    expect(altDaNomeFile('.png')).toBe('Immagine')
  })
})
