import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import { DisdettaSportello } from './DisdettaSportello'

const meta = {
  title: 'Componenti/DisdettaSportello',
  component: DisdettaSportello,
  args: { id: 1, token: 'prova', documento: 'Libretto', quando: 'venerdì 20 novembre, ore 10:05' },
} satisfies Meta<typeof DisdettaSportello>

export default meta
type Story = StoryObj<typeof meta>

export const Conferma: Story = {}
