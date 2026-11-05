import { describe, expect, it } from 'vitest'

import { CHANGELOG, TIPI_VOCE } from '@/content/changelog'

const numeri = (v: string) => v.split('.').map(Number)

describe('Changelog', () => {
  it('versioni nel formato x.y.z, dalla più recente, senza doppioni', () => {
    for (const v of CHANGELOG) expect(v.versione).toMatch(/^\d+\.\d+\.\d+$/)
    const ordinate = [...CHANGELOG].sort((a, b) => {
      const [x, y] = [numeri(a.versione), numeri(b.versione)]
      return y[0] - x[0] || y[1] - x[1] || y[2] - x[2]
    })
    expect(ordinate.map((v) => v.versione)).toEqual(CHANGELOG.map((v) => v.versione))
    expect(new Set(CHANGELOG.map((v) => v.versione)).size).toBe(CHANGELOG.length)
  })

  it('date valide e non crescenti', () => {
    const date = CHANGELOG.map((v) => v.data)
    expect([...date].sort().reverse()).toEqual(date)
    for (const d of date) expect(Number.isNaN(Date.parse(d))).toBe(false)
  })

  it('una versione con voci “nuovo” alza il numero centrale, le altre solo l’ultimo', () => {
    for (const v of CHANGELOG) {
      expect(v.voci.length).toBeGreaterThan(0)
      for (const x of v.voci) expect(TIPI_VOCE).toContain(x.tipo)
      const [, , patch] = numeri(v.versione)
      if (v.voci.some((x) => x.tipo === 'nuovo')) expect(patch).toBe(0)
    }
  })
})
