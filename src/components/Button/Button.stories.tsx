import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import { Button } from './Button'

const meta = {
  title: 'Componenti/Button',
  component: Button,
  args: { children: 'Iscriviti al corso' },
  argTypes: {
    variant: { control: 'inline-radio', options: ['primary', 'secondary', 'ghost'] },
    size: { control: 'inline-radio', options: ['md', 'lg'] },
  },
} satisfies Meta<typeof Button>

export default meta
type Story = StoryObj<typeof meta>

export const Primario: Story = { args: { variant: 'primary' } }
export const Secondario: Story = { args: { variant: 'secondary' } }
export const Leggero: Story = { args: { variant: 'ghost', children: 'Annulla' } }
export const Grande: Story = { args: { size: 'lg' } }
export const Disabilitato: Story = { args: { isDisabled: true } }
