import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import { SchermataSito } from './SchermataSito'

const meta: Meta<typeof SchermataSito> = {
  title: 'Componenti/SchermataSito',
  component: SchermataSito,
  args: {
    id: 'studenti-iscriversi',
    didascalia:
      'La pagina di un corso: il riquadro “Iscrizione al corso” con le date e il pulsante.',
  },
}
export default meta

export const IscrizioneCorso: StoryObj<typeof SchermataSito> = {}
