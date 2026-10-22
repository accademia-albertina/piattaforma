import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import { SiteFooter } from './SiteFooter'

const meta = {
  title: 'Componenti/SiteFooter',
  component: SiteFooter,
  parameters: { layout: 'fullscreen' },
  args: { anno: 2026 },
} satisfies Meta<typeof SiteFooter>

export default meta
type Story = StoryObj<typeof meta>

export const Standard: Story = {}
