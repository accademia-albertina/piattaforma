import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import { ACCESSI_HOME } from '@/lib/accessi-home'

import { AccessiRapidi } from './AccessiRapidi'

const meta = {
  title: 'Componenti/AccessiRapidi',
  component: AccessiRapidi,
  parameters: { layout: 'fullscreen' },
  args: { voci: ACCESSI_HOME },
} satisfies Meta<typeof AccessiRapidi>

export default meta
type Story = StoryObj<typeof meta>

export const Predefinito: Story = {}
