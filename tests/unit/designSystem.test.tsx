import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

vi.mock('next/link', () => ({
  default: (p: { href: string; className?: string; children: React.ReactNode }) => (
    <a href={p.href} className={p.className}>
      {p.children}
    </a>
  ),
}))

import DesignSystemPage from '@/app/(frontend)/design-system/page'
import { contrasto, GRUPPI_COLORI, ICONE, KIT, LOGHI, testoSopra } from '@/lib/designSystem'

import { axeViolations } from './axe'

afterEach(cleanup)

const PUBLIC = join(process.cwd(), 'public')

describe('Design System', () => {
  it('i colori mostrati sono gli stessi dei token del sito', () => {
    const css = readFileSync(join(process.cwd(), 'src/styles/colori.css'), 'utf8')
    for (const c of GRUPPI_COLORI.flatMap((g) => g.colori)) {
      const m = new RegExp(`${c.token}:\\s*(#[0-9a-f]{6})`, 'i').exec(css)
      expect(m?.[1].toLowerCase(), c.token).toBe(c.hex)
    }
  })

  it('tutti i file scaricabili esistono', () => {
    const file = [
      KIT.href,
      ...LOGHI.flatMap((l) => [l.anteprima, ...l.file.map((f) => f.href)]),
      ...ICONE.flatMap((i) => [
        `/design-system/icone-scuole/${i.file}.svg`,
        `/design-system/icone-scuole-sfondo/${i.file}.svg`,
      ]),
    ]
    for (const f of file) expect(existsSync(join(PUBLIC, f)), f).toBe(true)
  })

  it('calcola il contrasto come WCAG e sceglie il testo più leggibile', () => {
    expect(contrasto('#ffffff', '#000000')).toBeCloseTo(21, 1)
    expect(contrasto('#a23130', '#ffffff')).toBeCloseTo(6.96, 1)
    expect(testoSopra('#a23130').nome).toBe('bianco')
    expect(testoSopra('#d6e0e6').nome).toBe('inchiostro')
    // Nessun campione mostra testo sotto 4,5:1
    for (const c of GRUPPI_COLORI.flatMap((g) => g.colori)) {
      expect(testoSopra(c.hex).rapporto, c.nome).toBeGreaterThanOrEqual(4.5)
    }
  })

  it('la pagina è accessibile e offre il kit completo', async () => {
    const { container } = render(<DesignSystemPage />)
    expect(screen.getByRole('heading', { level: 1, name: 'Design System' })).toBeTruthy()
    expect(screen.getAllByRole('link', { name: /Scarica tutto/ })[0].getAttribute('href')).toBe(
      KIT.href,
    )
    expect(await axeViolations(container)).toEqual([])
  })
})
