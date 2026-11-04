import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

vi.mock('next/link', () => ({ default: (p: { href: string; children: React.ReactNode }) => <a href={p.href}>{p.children}</a> }))

import NovitaPage from '@/app/(frontend)/novita/page'
import { NOVITA } from '@/content/novita'

import { axeViolations } from './axe'

describe('Novità', () => {
  it('voci in ordine dal più recente, con date valide', () => {
    const date = NOVITA.map((n) => n.data)
    expect([...date].sort().reverse()).toEqual(date)
    for (const d of date) expect(Number.isNaN(Date.parse(d))).toBe(false)
  })

  it('la pagina elenca le voci senza violazioni axe', async () => {
    const { container } = render(<NovitaPage />)
    expect(screen.getAllByRole('heading', { level: 2 })).toHaveLength(NOVITA.length)
    expect(await axeViolations(container)).toEqual([])
  })
})
