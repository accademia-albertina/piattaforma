import { describe, expect, it } from 'vitest'

import { maiuscoleLauree, maiuscoleLaureeLexical } from '@/lib/terminologia'

describe('Laurea e Laurea Magistrale con la maiuscola', () => {
  it('mette la maiuscola e i livelli tra parentesi', () => {
    expect(maiuscoleLauree('studenti della laurea: numero di matricola')).toBe(
      'studenti della Laurea (Triennio): numero di matricola',
    )
    expect(maiuscoleLauree('studenti della laurea magistrale: numero')).toBe(
      'studenti della Laurea Magistrale (Biennio): numero',
    )
    expect(maiuscoleLauree('Dieci scuole, laurea e laurea magistrale.')).toBe(
      'Dieci scuole, Laurea e Laurea Magistrale.',
    )
    expect(maiuscoleLauree('Lauree e Lauree magistrali')).toBe('Lauree e Lauree Magistrali')
    expect(maiuscoleLauree('Insegnamenti dei corsi di Triennio e Biennio')).toBe(
      'Insegnamenti dei corsi di Laurea (Triennio) e Laurea Magistrale (Biennio)',
    )
  })

  it('non tocca indirizzi, lauree universitarie e post laurea', () => {
    for (const t of [
      'https://example.org/tesi-di-laurea/',
      'lauree universitarie affini',
      'tirocinio post laurea',
      'tirocinio post-laurea',
      'Laureato in Lettere',
    ])
      expect(maiuscoleLauree(t)).toBe(t)
  })

  it('cambia solo i nodi di testo', () => {
    const stato = { root: { children: [{ type: 'text', text: 'la laurea' }], url: '/laurea' } }
    expect(maiuscoleLaureeLexical(stato)).toEqual({
      root: { children: [{ type: 'text', text: 'la Laurea' }], url: '/laurea' },
    })
  })
})
