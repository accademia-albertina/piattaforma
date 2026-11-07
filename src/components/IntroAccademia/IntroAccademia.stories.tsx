import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import aulaPittura from '@/assets/repertorio/aula-pittura.webp'
import scalone from '@/assets/repertorio/scalone.webp'
import salaBlu from '@/assets/repertorio/sala-blu.webp'

import { IntroAccademia } from './IntroAccademia'

const meta = {
  title: 'Componenti/IntroAccademia',
  component: IntroAccademia,
  parameters: { layout: 'fullscreen' },
  args: {
    foto: scalone,
    dettagli: [salaBlu, aulaPittura],
    testo:
      'Dal 1678 Torino ha la sua scuola d’arte. Dieci scuole, dalla pittura al cinema, dalla scultura alle nuove tecnologie. Un palazzo nel centro della città, una pinacoteca, i laboratori. Qui si impara un mestiere antico e si cerca la propria stella.',
    cifre: [
      { valore: 1678, etichetta: 'Anno di fondazione' },
      { valore: 10, etichetta: 'Scuole' },
      { valore: 2, etichetta: 'Livelli di diploma, triennio e biennio' },
    ],
  },
} satisfies Meta<typeof IntroAccademia>

export default meta
type Story = StoryObj<typeof meta>

export const Predefinito: Story = {}
