import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import { HeroSlider } from './HeroSlider'

const meta = {
  title: 'Componenti/HeroSlider',
  component: HeroSlider,
  parameters: { layout: 'fullscreen' },
  args: {
    slides: [
      {
        titolo: 'Esiti ammissione e procedura di immatricolazione',
        href: '/avvisi/esiti-ammissione',
        data: '2026-09-23T09:00:00.000Z',
      },
      {
        titolo: 'Open Days 2026: l’Accademia apre le porte',
        href: '/avvisi/open-days',
        data: '2026-09-10T09:00:00.000Z',
      },
      {
        titolo: 'Abbonamento Musei riservato agli studenti',
        href: '/avvisi/abbonamento-musei',
        data: '2026-09-01T09:00:00.000Z',
      },
    ],
  },
} satisfies Meta<typeof HeroSlider>

export default meta
type Story = StoryObj<typeof meta>

export const SenzaImmagine: Story = {}
export const UnaSolaSlide: Story = {
  args: {
    slides: [
      {
        titolo: 'Chiusura estiva dell’Accademia',
        href: '/avvisi/chiusura',
        data: '2026-07-20T09:00:00.000Z',
      },
    ],
  },
}
