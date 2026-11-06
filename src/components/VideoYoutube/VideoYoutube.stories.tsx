import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import { VideoYoutube } from './VideoYoutube'

const meta = {
  title: 'Componenti/VideoYoutube',
  component: VideoYoutube,
  args: { id: 'dQw4w9WgXcQ', titolo: 'La Scuola di Pittura' },
} satisfies Meta<typeof VideoYoutube>

export default meta
type Story = StoryObj<typeof meta>

export const Predefinito: Story = {}
