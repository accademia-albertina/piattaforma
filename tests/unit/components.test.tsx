import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import {
  Alert,
  Attachments,
  AvvisoCard,
  Breadcrumbs,
  Button,
  HeroSlider,
  Pagination,
  SiteHeader,
  SkipLink,
  Tag,
} from '@/components'
import { pageWindow } from '@/components/Pagination/Pagination'

import { axeViolations } from './axe'

vi.mock('next/link', () => ({
  default: ({ href, children, ...rest }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}))

vi.mock('next/navigation', () => ({ usePathname: () => '/' }))

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
    expect(
      screen.getByRole('link', { name: 'Vai al contenuto principale' }).getAttribute('href'),
    ).toBe('#contenuto')
  })

  it('SiteHeader: mega menu apribile e chiudibile con Esc', async () => {
    const { container } = render(<SiteHeader currentHref="/avvisi" />)
    const toggle = screen.getByRole('button', { name: 'Menu' })
    expect(toggle.getAttribute('aria-expanded')).toBe('false')
    fireEvent.click(toggle)
    expect(toggle.getAttribute('aria-expanded')).toBe('true')
    const menu = screen.getByRole('navigation', { name: 'Principale' })
    expect(menu).toBeTruthy()
    expect(
      screen.getByRole('link', { name: 'Tutti gli avvisi' }).getAttribute('aria-current'),
    ).toBe('page')
    expect(screen.getByRole('img', { name: /Accademia Albertina/ })).toBeTruthy()
    expect(await axeViolations(container)).toEqual([])
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(toggle.getAttribute('aria-expanded')).toBe('false')
  })

  it('Breadcrumbs: l’ultima voce è la pagina corrente', async () => {
    const { container } = render(
      <Breadcrumbs
        items={[
          { label: 'Home', href: '/' },
          { label: 'Avvisi', href: '/avvisi' },
          { label: 'Dettaglio' },
        ]}
      />,
    )
    expect(screen.getByRole('navigation', { name: 'Percorso' })).toBeTruthy()
    expect(screen.getByText('Dettaglio').getAttribute('aria-current')).toBe('page')
    expect(await axeViolations(container)).toEqual([])
  })

  it('AvvisoCard: titolo come link e data leggibile', async () => {
    const { container } = render(
      <AvvisoCard
        titolo="Calendario esami"
        href="/avvisi/calendario-esami"
        data="2026-10-21T09:00:00.000Z"
        categorie={[{ label: 'Esami', href: '/avvisi?categoria=esami' }]}
        sommario="Sessione invernale."
      />,
    )
    expect(screen.getByRole('heading', { level: 2, name: 'Calendario esami' })).toBeTruthy()
    expect(screen.getByRole('link', { name: 'Calendario esami' }).getAttribute('href')).toBe(
      '/avvisi/calendario-esami',
    )
    expect(container.querySelector('time')?.getAttribute('datetime')).toBe(
      '2026-10-21T09:00:00.000Z',
    )
    expect(await axeViolations(container)).toEqual([])
  })

  it('Pagination: finestra di pagine e pagina corrente', async () => {
    expect(pageWindow(1, 3)).toEqual([1, 2, 3])
    expect(pageWindow(5, 90)).toEqual([1, '…', 4, 5, 6, '…', 90])
    const { container } = render(
      <Pagination page={5} totalPages={90} hrefFor={(p) => `/avvisi?pagina=${p}`} />,
    )
    expect(screen.getByRole('navigation', { name: 'Paginazione' })).toBeTruthy()
    expect(screen.getByRole('link', { name: /5/ }).getAttribute('aria-current')).toBe('page')
    expect(await axeViolations(container)).toEqual([])
  })

  it('Attachments: nome, tipo e dimensione del file', async () => {
    const { container } = render(
      <Attachments
        items={[
          {
            nome: 'Bando',
            url: '/media/bando.pdf',
            mimeType: 'application/pdf',
            filesize: 248_000,
          },
        ]}
      />,
    )
    expect(screen.getByRole('heading', { name: 'Allegati' })).toBeTruthy()
    expect(screen.getByRole('link', { name: /Bando/ }).getAttribute('href')).toBe(
      '/media/bando.pdf',
    )
    expect(await axeViolations(container)).toEqual([])
  })

  it('HeroSlider: carousel accessibile, una slide visibile alla volta', async () => {
    const slides = [1, 2, 3].map((n) => ({
      titolo: `Avviso ${n}`,
      href: `/avvisi/avviso-${n}`,
      data: '2026-10-21T09:00:00.000Z',
    }))
    const { container } = render(<HeroSlider slides={slides} />)
    expect(
      screen
        .getByRole('region', { name: 'Avvisi in evidenza' })
        .getAttribute('aria-roledescription'),
    ).toBe('carousel')
    expect(screen.getByRole('heading', { name: 'Avviso 1' })).toBeTruthy()
    expect(screen.queryByRole('heading', { name: 'Avviso 2' })).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Avviso successivo' }))
    expect(screen.getByRole('heading', { name: 'Avviso 2' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Avviso 2 di 3' }).getAttribute('aria-current')).toBe(
      'true',
    )
    fireEvent.click(screen.getByRole('button', { name: 'Avviso precedente' }))
    fireEvent.click(screen.getByRole('button', { name: 'Avviso precedente' }))
    expect(screen.getByRole('heading', { name: 'Avviso 3' })).toBeTruthy()
    expect(await axeViolations(container)).toEqual([])
  })
})
