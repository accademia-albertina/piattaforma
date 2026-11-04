import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import { FiltriSchede } from './FiltriSchede'

const meta = {
  title: 'Componenti/FiltriSchede',
  component: FiltriSchede,
  args: {
    label: 'Categorie',
    schede: [
      { label: 'Tutte', href: '/avvisi', attiva: true },
      { label: 'Generali', href: '/avvisi?categoria=generali' },
      { label: 'Lezioni', href: '/avvisi?categoria=lezioni' },
      { label: 'Esami', href: '/avvisi?categoria=esami' },
    ],
  },
} satisfies Meta<typeof FiltriSchede>

export default meta
type Story = StoryObj<typeof meta>

export const Predefinito: Story = {}
