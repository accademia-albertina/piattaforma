import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import SchermataGuida from '@/components/admin/SchermataGuida'
import { GUIDE } from '@/content/guide'
import schermate from '@/content/guida-schermate.json'

import { SCENE } from '../../scripts/guida/scene.mjs'

import { axeViolations } from './axe'

type Dati = { segni: { n: number; x: number; y: number; w: number; h: number }[] }
const DATI = schermate as Record<string, Dati>

describe('Schermate della Guida', () => {
  it('ogni schermata citata in una guida ha la sua scena, le immagini e i riquadri', () => {
    const scene = new Set(SCENE.map((s: { id: string }) => s.id))
    for (const g of GUIDE) {
      for (const s of g.schermate ?? []) {
        expect(scene.has(s.id), `scena ${s.id}`).toBe(true)
        expect(DATI[s.id], `schermata ${s.id} non generata`).toBeDefined()
        for (const segno of DATI[s.id].segni) {
          // Il numero del riquadro è quello di un passo della stessa guida
          expect(segno.n, `${s.id}: riquadro ${segno.n}`).toBeLessThanOrEqual(g.passi.length)
          // e il riquadro sta dentro l'immagine
          expect(segno.x + segno.w).toBeLessThanOrEqual(100.01)
          expect(segno.y + segno.h).toBeLessThanOrEqual(100.01)
        }
      }
    }
  })

  it('mostra la versione chiara e scura, i riquadri numerati e passa axe', async () => {
    const { container } = render(
      <SchermataGuida id="avvisi" didascalia="Il modulo di un nuovo avviso." />,
    )
    const img = container.querySelectorAll('img')
    expect(img).toHaveLength(2)
    expect(img[0].getAttribute('src')).toBe('/guida/avvisi-chiaro.webp')
    expect(img[1].getAttribute('src')).toBe('/guida/avvisi-scuro.webp')
    expect(img[0].getAttribute('alt')).toMatch(/passo 2/)
    expect(container.querySelectorAll('[data-n]')).toHaveLength(DATI.avvisi.segni.length)
    expect(container.querySelector('figcaption')?.textContent).toBe('Il modulo di un nuovo avviso.')
    expect(await axeViolations(container)).toEqual([])
  })

  it('una schermata non ancora generata non mostra nulla', () => {
    const { container } = render(<SchermataGuida id="inesistente" didascalia="x" />)
    expect(container.innerHTML).toBe('')
  })
})
