import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

// jsdom non ha matchMedia (GSAP lo usa già all'import): simuliamo "riduci movimento" attivo.
vi.hoisted(() => {
  window.matchMedia = ((q: string) => ({
    matches: q.includes('reduce') && !q.includes('no-preference'),
    media: q,
    addListener() {},
    removeListener() {},
    addEventListener() {},
    removeEventListener() {},
  })) as unknown as typeof window.matchMedia
})

import { IntroAccademia, InvitoTour } from '@/components'

import { axeViolations } from './axe'

afterEach(cleanup)

const foto = { src: '/scalone.webp', width: 1600, height: 900 }

describe('Homepage: sezione emozionale', () => {
  const props = {
    foto,
    dettagli: [foto, foto] as [typeof foto, typeof foto],
    testo: 'Dal 1678 Torino ha la sua scuola d’arte.',
    cifre: [{ valore: 1678, etichetta: 'Anno di fondazione' }],
  }

  it('motto in francese, foto decorative, testo e cifre leggibili senza animazione, senza violazioni axe', async () => {
    const { container } = render(<IntroAccademia {...props} />)
    const motto = screen.getByRole('heading', { level: 2, name: 'J’attends mon astre' })
    expect(motto.getAttribute('lang')).toBe('fr')
    expect(screen.getByText(/Aspetto la mia stella/)).toBeTruthy()
    expect(screen.getAllByText(props.testo)).toHaveLength(2) // visibile (aria-hidden) + lettori di schermo
    expect(screen.getByText('1678').tagName).toBe('DD')
    for (const img of container.querySelectorAll('img')) expect(img.getAttribute('alt')).toBe('')
    expect(await axeViolations(container)).toEqual([])
  })
})

describe('Homepage: invito al virtual tour', () => {
  it('ha titolo, link esterno dichiarato e foto decorativa, senza violazioni axe', async () => {
    const { container } = render(
      <InvitoTour href="https://tour.albertina-academy.it/" immagine={foto} />,
    )
    expect(screen.getByRole('heading', { level: 2, name: 'Esplora l’Accademia' })).toBeTruthy()
    const link = screen.getByRole('link', { name: /Inizia il tour.*nuova scheda/ })
    expect(link.getAttribute('href')).toBe('https://tour.albertina-academy.it/')
    expect(link.getAttribute('target')).toBe('_blank')
    expect(container.querySelector('img')?.getAttribute('alt')).toBe('')
    expect(await axeViolations(container)).toEqual([])
  })
})
