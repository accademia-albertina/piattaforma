import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import { Tag } from './Tag'

const meta = {
  title: 'Componenti/Tag',
  component: Tag,
  args: { children: 'Esami' },
} satisfies Meta<typeof Tag>

export default meta
type Story = StoryObj<typeof meta>

export const Neutro: Story = {}
export const Link: Story = { args: { href: '/avvisi?categoria=esami' } }
export const InEvidenza: Story = { args: { tone: 'brand', children: 'In evidenza' } }
