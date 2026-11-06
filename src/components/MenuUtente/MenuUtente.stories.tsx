import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import { MenuUtente } from './MenuUtente'

const meta = {
  title: 'Componenti/MenuUtente',
  component: MenuUtente,
  decorators: [
    (Story) => (
      <div
        style={{
          background: 'var(--color-brand-strong)',
          color: '#fff',
          padding: '1rem',
          display: 'flex',
          justifyContent: 'flex-end',
        }}
      >
        {Story()}
      </div>
    ),
  ],
} satisfies Meta<typeof MenuUtente>

export default meta
type Story = StoryObj<typeof meta>

export const SenzaAccesso: Story = { args: { utente: null } }
export const Studente: Story = {
  args: {
    utente: {
      nome: 'Giulia',
      cognome: 'Bassi',
      email: '23456t@albertina.academy',
      roles: ['studente'],
    },
  },
}
export const Personale: Story = {
  args: {
    utente: {
      nome: 'Paola',
      cognome: 'Verdi',
      email: 'paola.verdi@albertina.academy',
      roles: ['docente'],
    },
  },
}
