import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import { TornaSu } from './TornaSu'

const meta = {
  title: 'Componenti/TornaSu',
  component: TornaSu,
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof TornaSu>

export default meta
type Story = StoryObj<typeof meta>

/** Con soglia 0 il pulsante è subito visibile, in basso a destra. */
export const Predefinito: Story = { args: { soglia: -1 } }
