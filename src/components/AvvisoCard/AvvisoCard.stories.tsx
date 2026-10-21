import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import { AvvisoCard } from './AvvisoCard'

const meta = {
  title: 'Componenti/AvvisoCard',
  component: AvvisoCard,
  args: {
    titolo: 'Sessione invernale: calendario degli esami',
    href: '/avvisi/sessione-invernale-calendario-esami',
    data: '2026-10-21T09:00:00.000Z',
    categorie: [{ label: 'Esami', href: '/avvisi?categoria=esami' }],
    sommario:
      'Il calendario della sessione invernale è disponibile. Le iscrizioni aprono il 3 novembre.',
  },
  decorators: [(Story) => <div style={{ maxWidth: 420 }}>{Story()}</div>],
} satisfies Meta<typeof AvvisoCard>

export default meta
type Story = StoryObj<typeof meta>

export const Standard: Story = {}
export const InEvidenza: Story = {
  args: {
    titolo: 'Chiusura dell’Accademia per le festività',
    categorie: [
      { label: 'In evidenza', href: '/avvisi?categoria=in-evidenza', evidenza: true },
      { label: 'Generali', href: '/avvisi?categoria=generali' },
    ],
  },
}
export const SenzaSommario: Story = { args: { sommario: undefined } }
