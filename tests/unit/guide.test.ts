import { describe, expect, it } from 'vitest'

import { GUIDE, guideDi } from '@/content/guide'

const ids = (roles: string[]) => guideDi({ roles }).map((g) => g.id)

describe('Guide del pannello per ruolo', () => {
  it('il docente vede solo le guide di ciò che può modificare', () => {
    expect(ids(['docente'])).toEqual([
      'primi-passi',
      'bozze',
      'avvisi',
      'file',
      'profilo',
      'corsi-docente',
      'iscritti',
    ])
  })

  it('la segreteria vede pagine e calendari, non Albo né utenti', () => {
    const s = ids(['segreteria'])
    expect(s).toContain('pagine')
    expect(s).toContain('calendari')
    expect(s).toContain('finestre')
    expect(s).not.toContain('albo')
    expect(s).not.toContain('utenti')
    expect(s).not.toContain('corsi-docente')
  })

  it('la vicedirezione gestisce corsi e docenti ma non utenti e menu', () => {
    const v = ids(['vicedirezione'])
    expect(v).toContain('corsi-docenti')
    expect(v).not.toContain('utenti')
    expect(v).not.toContain('menu')
  })

  it("l'admin vede tutte le guide; chi non entra nel pannello solo i primi passi", () => {
    expect(ids(['admin'])).toEqual(GUIDE.map((g) => g.id))
    expect(ids(['studente'])).toEqual(['primi-passi'])
  })

  it('ogni guida ha passi e un id unico', () => {
    expect(new Set(GUIDE.map((g) => g.id)).size).toBe(GUIDE.length)
    for (const g of GUIDE) expect(g.passi.length).toBeGreaterThan(0)
  })
})
