import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import { Fisarmonica } from './Fisarmonica'

const meta = {
  title: 'Componenti/Fisarmonica',
  component: Fisarmonica,
  args: {
    livello: 2,
    voci: [
      {
        id: 'quando',
        titolo: 'Quando si presenta la domanda di ammissione?',
        contenuto: <p>Dal 1° luglio al 31 agosto, tramite Isidata.</p>,
      },
      {
        id: 'portfolio',
        titolo: 'Serve un portfolio?',
        contenuto: <p>Sì, per tutte le scuole del triennio: massimo 20 tavole in un unico PDF.</p>,
      },
      {
        id: 'tasse',
        titolo: 'Quanto costa l’iscrizione?',
        contenuto: <p>Il contributo dipende dall’ISEE: vedi il regolamento tasse.</p>,
      },
    ],
  },
} satisfies Meta<typeof Fisarmonica>

export default meta
type Story = StoryObj<typeof meta>

export const Base: Story = {}
