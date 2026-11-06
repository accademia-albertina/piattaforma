import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import { SchedePercorso } from './SchedePercorso'

const meta = {
  title: 'Componenti/SchedePercorso',
  component: SchedePercorso,
  args: {
    label: 'Percorsi della scuola',
    percorsi: [
      { id: 'triennio', label: 'Triennio', contenuto: <p>Diploma accademico di primo livello.</p> },
      {
        id: 'biennio',
        label: 'Biennio specialistico',
        contenuto: <p>Diploma accademico di secondo livello.</p>,
      },
    ],
  },
} satisfies Meta<typeof SchedePercorso>

export default meta
type Story = StoryObj<typeof meta>

export const DuePercorsi: Story = {}
export const SoloTriennio: Story = {
  args: { percorsi: [{ id: 'triennio', label: 'Triennio', contenuto: <p>Solo triennio.</p> }] },
}
