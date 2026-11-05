import { describe, expect, it } from 'vitest'

import {
  COLONNE,
  campateRighe,
  corrisponde,
  normalizzaRighe,
  righeDaIncolla,
  valoriFiltro,
} from '@/lib/calendari'

const col = COLONNE.lezioni
const riga = (
  corso: string,
  livello: string,
  docenti: string,
  giorno: string,
  inizio = '9:00',
) => ({
  corso,
  livello,
  docenti,
  giorno,
  inizio,
  fine: '13:00',
  semestre: '1',
  aula: 'A02',
})

describe('Calendari', () => {
  it('unisce le celle uguali una sotto l’altra, solo se è unita anche la colonna a sinistra', () => {
    const righe = [
      riga('Anatomia', 'Triennio', 'Ribero', 'Giovedì'),
      riga('Anatomia', 'Triennio', 'Ribero', 'Giovedì', '14:30'),
      riga('Anatomia', 'Triennio', 'Fanti', 'Giovedì'),
      riga('Antropologia', 'Triennio', 'Fanti', 'Martedì'),
    ]
    const span = campateRighe(righe, col)
    expect(span.map((r) => r.slice(0, 3))).toEqual([
      [3, 3, 2],
      [0, 0, 0],
      [0, 0, 1],
      [1, 1, 1],
    ])
  })

  it('legge le righe incollate da Excel, anche con a capo tra virgolette', () => {
    const testo =
      'Anatomia\tTriennio\t"Ribero\n(per Grafica)"\tGiovedì\n\nLitografia\tBiennio\tBadelita\r\n'
    const righe = righeDaIncolla(testo, col)
    expect(righe).toHaveLength(2)
    expect(righe[0].docenti).toBe('Ribero\n(per Grafica)')
    expect(righe[1]).toMatchObject({ corso: 'Litografia', livello: 'Biennio', giorno: '' })
  })

  it('scarta righe vuote e campi estranei', () => {
    const out = normalizzaRighe('esami', [{ docente: ' Ajani ', x: 'no' }, {}, null, { corso: '' }])
    expect(out).toEqual([
      { docente: 'Ajani', corso: '', livello: '', data: '', ora: '', commissione: '', aula: '' },
    ])
  })

  it('offre i giorni in ordine di settimana e filtra per contenuto', () => {
    const righe = [
      riga('A', 'Triennio\nBiennio', 'X', 'Venerdì'),
      riga('B', 'Biennio', 'Y', 'Martedì\n(lab)'),
    ]
    expect(valoriFiltro(righe, 'giorno')).toEqual(['Martedì', 'Venerdì'])
    expect(valoriFiltro(righe, 'livello')).toEqual(['Biennio', 'Triennio'])
    expect(corrisponde(righe[0], 'livello', 'Biennio')).toBe(true)
    expect(corrisponde(righe[1], 'giorno', 'Martedì')).toBe(true)
  })

  it('ordina le date degli esami scritte all’italiana', () => {
    const righe = [{ data: '02/07/2026' }, { data: '23/06/2026' }] as Record<string, string>[]
    expect(valoriFiltro(righe, 'data')).toEqual(['23/06/2026', '02/07/2026'])
  })
})

describe('Calendari: semestre', () => {
  it('“1 e 2” compare sia nel primo sia nel secondo semestre', () => {
    const righe = [{ semestre: '1 e 2' }, { semestre: '2\n(a settimane alterne A)' }]
    expect(valoriFiltro(righe, 'semestre')).toEqual(['1', '2'])
    expect(corrisponde(righe[0], 'semestre', '1')).toBe(true)
    expect(corrisponde(righe[1], 'semestre', '1')).toBe(false)
  })
})
