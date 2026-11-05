import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import { StampaPagina } from './StampaPagina'

const meta = {
  title: 'Componenti/StampaPagina',
  component: StampaPagina,
} satisfies Meta<typeof StampaPagina>

export default meta
type Story = StoryObj<typeof meta>

export const Predefinito: Story = {}
export const ConEtichetta: Story = { args: { label: 'Stampa l’orario' } }
