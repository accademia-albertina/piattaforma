import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import { IntestazioneStampa } from './IntestazioneStampa'

const meta = {
  title: 'Componenti/IntestazioneStampa',
  component: IntestazioneStampa,
} satisfies Meta<typeof IntestazioneStampa>

export default meta
type Story = StoryObj<typeof meta>

/** Nel sito compare solo quando si stampa una pagina. */
export const AnteprimaStampa: Story = { args: { visibileASchermo: true } }
