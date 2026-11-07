import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import SchermataGuida from './SchermataGuida'

const meta = {
  title: 'Pannello/SchermataGuida',
  component: SchermataGuida,
  args: { id: 'avvisi', didascalia: 'Il modulo di un nuovo avviso.' },
  decorators: [
    (Story) => (
      <div style={{ maxWidth: 880 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof SchermataGuida>

export default meta
type Story = StoryObj<typeof meta>

export const Avvisi: Story = {}

/** Più riquadri con lo stesso numero, per elementi lontani tra loro. */
export const Utenti: Story = {
  args: { id: 'utenti-2', didascalia: 'L’account di una persona: il ruolo si sceglie in “Ruoli”.' },
}
