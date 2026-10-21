import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import { Breadcrumbs } from './Breadcrumbs'

const meta = {
  title: 'Componenti/Breadcrumbs',
  component: Breadcrumbs,
  args: {
    items: [
      { label: 'Home', href: '/' },
      { label: 'Avvisi', href: '/avvisi' },
      { label: 'Sessione invernale: calendario degli esami' },
    ],
  },
} satisfies Meta<typeof Breadcrumbs>

export default meta
type Story = StoryObj<typeof meta>

export const Standard: Story = {}
export const DueLivelli: Story = {
  args: { items: [{ label: 'Home', href: '/' }, { label: 'Avvisi' }] },
}
