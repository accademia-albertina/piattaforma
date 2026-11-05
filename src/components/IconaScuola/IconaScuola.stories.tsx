import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import { ICONE_SCUOLE } from '@/assets/icone-scuole'

import { IconaScuola } from './IconaScuola'

const meta = {
  title: 'Componenti/IconaScuola',
  component: IconaScuola,
  args: { scuola: 'pittura', size: 56 },
} satisfies Meta<typeof IconaScuola>

export default meta
type Story = StoryObj<typeof meta>

export const Una: Story = {}
export const Tutte: Story = {
  render: (args) => (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24, color: 'var(--color-heading)' }}>
      {Object.keys(ICONE_SCUOLE).map((s) => (
        <IconaScuola key={s} {...args} scuola={s} />
      ))}
    </div>
  ),
}
