import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import scalone from '@/assets/repertorio/scalone.webp'

import { InvitoTour } from './InvitoTour'

const meta = {
  title: 'Componenti/InvitoTour',
  component: InvitoTour,
  parameters: { layout: 'fullscreen' },
  args: { href: 'https://tour.albertina-academy.it/', immagine: scalone },
} satisfies Meta<typeof InvitoTour>

export default meta
type Story = StoryObj<typeof meta>

export const Predefinito: Story = {}
