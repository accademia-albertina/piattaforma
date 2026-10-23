import { describe, expect, it } from 'vitest'

import { riassuntoBlocco, testoLexical } from '@/components/admin/riassuntoBlocco'

const lexical = (...paragrafi: string[]) => ({
  root: {
    children: paragrafi.map((testo) => ({
      type: 'paragraph',
      children: [{ type: 'text', text: testo }],
    })),
  },
})

describe('riassuntoBlocco', () => {
  it('usa il titolo della sezione, poi la didascalia', () => {
    expect(riassuntoBlocco({ titolo: '  Contatti ', voci: [{}] })).toBe('Contatti')
    expect(riassuntoBlocco({ didascalia: 'Facciata' })).toBe('Facciata')
  })

  it('usa l’inizio del testo e lo accorcia', () => {
    expect(riassuntoBlocco({ testo: lexical('Esami a', 'settembre') })).toBe('Esami a settembre')
    const lungo = riassuntoBlocco({ testo: lexical('parola '.repeat(30)) })
    expect(lungo.length).toBeLessThanOrEqual(80)
    expect(lungo.endsWith('…')).toBe(true)
  })

  it('conta le voci quando non c’è testo', () => {
    expect(riassuntoBlocco({ voci: [{}] })).toBe('1 voce')
    expect(riassuntoBlocco({ immagini: [{}, {}] })).toBe('2 immagini')
    expect(riassuntoBlocco({ titolo: '', documenti: [{}, {}, {}] })).toBe('3 documenti')
  })

  it('blocco vuoto o dati assenti', () => {
    expect(riassuntoBlocco({})).toBe('')
    expect(riassuntoBlocco(undefined)).toBe('')
    expect(testoLexical(null)).toBe('')
  })
})
