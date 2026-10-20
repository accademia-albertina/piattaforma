import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import { SiteHeader } from './SiteHeader'

const meta = {
  title: 'Layout/SiteHeader',
  component: SiteHeader,
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof SiteHeader>

export default meta
type Story = StoryObj<typeof meta>

export const Desktop: Story = { args: { currentHref: '/didattica' } }
export const Mobile: Story = {
  args: { currentHref: '/didattica' },
  globals: { viewport: { value: 'mobile1', isRotated: false } },
}
