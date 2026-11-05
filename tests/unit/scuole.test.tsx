import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

vi.mock('next/link', () => ({
  default: (p: { href: string; className?: string; children: React.ReactNode }) => (
    <a href={p.href} className={p.className}>
      {p.children}
    </a>
  ),
}))

import { ICONE_SCUOLE } from '@/assets/icone-scuole'
import { IconaScuola, SchedaScuola } from '@/components'
import { DIPARTIMENTI_SCUOLE } from '@/seed/dipartimenti-scuole'

import { axeViolations } from './axe'

afterEach(cleanup)

describe('Scuole', () => {
  it('ogni scuola con dipartimento ha la sua icona ufficiale', () => {
    expect(Object.keys(ICONE_SCUOLE).sort()).toEqual(Object.keys(DIPARTIMENTI_SCUOLE).sort())
    for (const { svg } of Object.values(ICONE_SCUOLE)) {
      expect(svg).not.toMatch(/<script|on\w+=|#1F292B/i)
    }
  })

  it("l'icona è decorativa e segue il colore del testo", () => {
    const { container } = render(<IconaScuola scuola="pittura" />)
    const svg = container.querySelector('svg')!
    expect(svg.getAttribute('aria-hidden')).toBe('true')
    expect(svg.innerHTML).toContain('currentColor')
    cleanup()
    expect(render(<IconaScuola scuola="inesistente" />).container.innerHTML).toBe('')
  })

  it('la scheda ha nome, dipartimento e invito, senza violazioni axe', async () => {
    const { container } = render(
      <ul>
        <li>
          <SchedaScuola
            nome="Pittura"
            slug="pittura"
            href="/corsi?scuola=pittura"
            dipartimento="Dipartimento di Arti Visive"
            immagine={{ url: '/foto.webp', width: 1200, height: 800 }}
            invito="Vedi i corsi"
            livello={2}
          />
        </li>
      </ul>,
    )
    expect(screen.getByRole('link').getAttribute('href')).toBe('/corsi?scuola=pittura')
    expect(screen.getByRole('heading', { level: 2, name: 'Pittura' })).toBeTruthy()
    expect(screen.getByText('Dipartimento di Arti Visive')).toBeTruthy()
    expect(screen.getByText(/Vedi i corsi/)).toBeTruthy()
    expect(container.querySelector('svg[aria-hidden="true"]')).toBeTruthy()
    expect(await axeViolations(container)).toEqual([])
  })
})
