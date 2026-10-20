import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import { Alert } from './Alert'

const meta = {
  title: 'Componenti/Alert',
  component: Alert,
  args: {
    children: 'Le iscrizioni agli esami della sessione invernale chiudono il 15 gennaio.',
  },
} satisfies Meta<typeof Alert>

export default meta
type Story = StoryObj<typeof meta>

export const Informazione: Story = { args: { tone: 'info' } }
export const Successo: Story = { args: { tone: 'success', title: 'Iscrizione inviata' } }
export const Attenzione: Story = { args: { tone: 'warning' } }
export const Errore: Story = { args: { tone: 'error', title: 'Invio non riuscito', live: true } }
