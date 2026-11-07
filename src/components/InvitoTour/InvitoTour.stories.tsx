import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import pinacoteca from '@/assets/repertorio/pinacoteca.webp'

import { InvitoTour } from './InvitoTour'

const meta = {
  title: 'Componenti/InvitoTour',
  component: InvitoTour,
  parameters: { layout: 'fullscreen' },
  args: { href: 'https://tour.albertina-academy.it/', immagine: pinacoteca },
} satisfies Meta<typeof InvitoTour>

export default meta
type Story = StoryObj<typeof meta>

export const Predefinito: Story = {}
