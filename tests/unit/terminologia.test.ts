import { describe, expect, it } from 'vitest'

import { aggiornaTerminologia, aggiornaTerminologiaLexical } from '@/lib/terminologia'

describe('terminologia Laurea / Laurea magistrale', () => {
  it('sostituisce i titoli AFAM concordando articoli e preposizioni', () => {
    expect(
      aggiornaTerminologia(
        'per il conseguimento del Diploma accademico di primo livello della Scuola',
      ),
    ).toBe('per il conseguimento della Laurea della Scuola')
    expect(
      aggiornaTerminologia('prevede, per il Diploma Accademico di Secondo Livello di Decorazione'),
    ).toBe('prevede, per la Laurea magistrale in Decorazione')
    expect(aggiornaTerminologia('Il Corso di Diploma di II Livello si propone')).toBe(
      'Il Corso di Laurea magistrale si propone',
    )
    expect(aggiornaTerminologia('Diploma Accademico di I Livello in “Grafica”')).toBe(
      'Laurea in “Grafica”',
    )
  })

  it('accorda il participio e usa il livello per il «diploma» generico', () => {
    expect(
      aggiornaTerminologia('Il Diploma Accademico di Secondo livello viene conseguito una volta'),
    ).toBe('La Laurea magistrale viene conseguita una volta')
    expect(aggiornaTerminologia('Il diploma viene conseguito una volta', 'biennio')).toBe(
      'La laurea magistrale viene conseguita una volta',
    )
    expect(aggiornaTerminologia('Il diploma viene conseguito', 'triennio')).toBe(
      'La laurea viene conseguita',
    )
  })

  it('non tocca lauree universitarie e diploma di scuola secondaria', () => {
    for (const t of [
      'Laurea di Primo Livello ottenuta presso DAMS;',
      'in possesso di un diploma di Scuola secondaria superiore',
      'Tutti i titoli (lauree e diplomi di 1° livello) conseguiti in Italia',
    ])
      expect(aggiornaTerminologia(t)).toBe(t)
  })

  it('aggiorna solo i nodi di testo di Lexical', () => {
    const stato = {
      root: { children: [{ type: 'text', text: 'I diplomati della Scuola', format: 0 }] },
    }
    expect(aggiornaTerminologiaLexical(stato)).toEqual({
      root: { children: [{ type: 'text', text: 'I laureati della Scuola', format: 0 }] },
    })
  })
})
