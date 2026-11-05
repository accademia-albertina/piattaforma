import { describe, expect, it } from 'vitest'

import { inFrase, tuttoMaiuscolo, validaMaiuscole } from '@/utilities/maiuscole'

describe('Titoli in maiuscolo', () => {
  it('riconosce i titoli gridati ma non quelli con qualche sigla', () => {
    expect(tuttoMaiuscolo('DECRETO GRADUATORIA DEFINITIVA DOTTORATI')).toBe(true)
    expect(tuttoMaiuscolo('FLC CGIL - Nuovo sito online')).toBe(false)
    expect(tuttoMaiuscolo('AFAM')).toBe(false)
    expect(tuttoMaiuscolo('Prof. Rossi - STORIA DEL CINEMA E DEL VIDEO')).toBe(true)
    expect(tuttoMaiuscolo('UIL RUA - comunicazione cambio sede')).toBe(false)
    expect(validaMaiuscole('Calendario esami')).toBe(true)
    expect(validaMaiuscole('CALENDARIO DEGLI ESAMI INVERNALI')).toMatch(/maiuscolo/)
  })

  it('riscrive in frase tenendo sigle, numeri romani, abbreviazioni e nomi propri', () => {
    expect(inFrase('DECRETO GRADUATORIA DOTTORATI XLI')).toBe('Decreto graduatoria dottorati XLI')
    expect(inFrase('BANDO AI SENSI DEL D.LGS. 36/2023 PER L’ACCADEMIA ALBERTINA DI TORINO')).toBe(
      'Bando ai sensi del D.LGS. 36/2023 per l’Accademia Albertina di Torino',
    )
    expect(inFrase('INDAGINE DI MERCATO PER LE LICENZE SOFTWARE AFAMScadenza: 01/10/2026')).toBe(
      'Indagine di mercato per le licenze software AFAM – Scadenza: 01/10/2026',
    )
    expect(inFrase('Titolo già scritto bene')).toBe('Titolo già scritto bene')
    expect(inFrase('Seminario - AVVISO PUBBLICO PER MANIFESTAZIONE DI INTERESSE - CUP')).toBe(
      'Seminario - Avviso pubblico per manifestazione di interesse - CUP',
    )
    expect(inFrase('PROPOSTA TIROCINIO ideazione di eventi')).toBe(
      'PROPOSTA TIROCINIO ideazione di eventi',
    )
  })
})
