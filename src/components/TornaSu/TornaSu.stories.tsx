import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import { TornaSu } from './TornaSu'

const meta = {
  title: 'Componenti/TornaSu',
  component: TornaSu,
} satisfies Meta<typeof TornaSu>

export default meta
type Story = StoryObj<typeof meta>

/** Nel sito compare dopo 600 px di scorrimento; qui è sempre visibile. */
export const Visibile: Story = { args: { sempreVisibile: true } }
