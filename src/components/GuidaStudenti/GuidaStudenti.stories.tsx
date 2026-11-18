import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import { GuidaStudenti } from './GuidaStudenti'

const meta: Meta<typeof GuidaStudenti> = {
  title: 'Componenti/GuidaStudenti',
  component: GuidaStudenti,
}
export default meta

export const Guida: StoryObj<typeof GuidaStudenti> = {}
