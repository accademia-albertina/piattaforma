import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { Alert, Button, SiteHeader, SkipLink, Tag } from '@/components'

import { axeViolations } from './axe'

vi.mock('next/link', () => ({
  default: ({ href, children, ...rest }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}))

afterEach(cleanup)

describe('componenti accessibili', () => {
  it('Button non ha violazioni axe', async () => {
    const { container } = render(<Button>Invia</Button>)
    expect(await axeViolations(container)).toEqual([])
  })

  it('Alert annuncia gli errori solo se live', async () => {
    const { container, rerender } = render(<Alert tone="error">Testo</Alert>)
    expect(screen.queryByRole('alert')).toBeNull()
    rerender(
      <Alert tone="error" live>
        Testo
      </Alert>,
    )
    expect(screen.getByRole('alert')).toBeTruthy()
    expect(await axeViolations(container)).toEqual([])
  })

  it('Tag link non ha violazioni axe', async () => {
    const { container } = render(<Tag href="/avvisi?categoria=esami">Esami</Tag>)
    expect(await axeViolations(container)).toEqual([])
  })

  it('SkipLink punta al contenuto principale', () => {
    render(<SkipLink />)
    expect(screen.getByRole('link', { name: 'Vai al contenuto principale' }).getAttribute('href')).toBe(
      '#contenuto',
    )
  })

  it('SiteHeader: menu apribile e pagina corrente segnalata', async () => {
    const { container } = render(<SiteHeader currentHref="/didattica" />)
    const toggle = screen.getByRole('button', { name: 'Menu' })
    expect(toggle.getAttribute('aria-expanded')).toBe('false')
    fireEvent.click(toggle)
    expect(screen.getByRole('button', { name: 'Chiudi menu' }).getAttribute('aria-expanded')).toBe('true')
    expect(screen.getByRole('link', { name: 'Didattica' }).getAttribute('aria-current')).toBe('page')
    expect(await axeViolations(container)).toEqual([])
  })
})
