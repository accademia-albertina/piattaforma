import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

vi.mock('next/link', () => ({
  default: (p: { href: string; children: React.ReactNode; className?: string }) => (
    <a href={p.href} className={p.className}>
      {p.children}
    </a>
  ),
}))

import NotFound from '@/app/(frontend)/not-found'

import { axeViolations } from './axe'

describe('Pagina 404', () => {
  it('offre ricerca, link rapidi e home, senza violazioni axe', async () => {
    const { container } = render(<NotFound />)
    expect(screen.getByRole('search')).toBeTruthy()
    expect(screen.getByRole('searchbox', { name: 'Cerca nel sito' })).toBeTruthy()
    expect(screen.getByRole('navigation', { name: 'Pagine utili' })).toBeTruthy()
    expect(screen.getByRole('link', { name: 'Torna alla home' }).getAttribute('href')).toBe('/')
    expect(await axeViolations(container)).toEqual([])
  })
})
