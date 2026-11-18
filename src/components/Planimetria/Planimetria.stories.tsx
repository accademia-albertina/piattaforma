import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import { Planimetria } from './Planimetria'

const meta: Meta<typeof Planimetria> = {
  title: 'Componenti/Planimetria',
  component: Planimetria,
}
export default meta

export const Sede: StoryObj<typeof Planimetria> = {}
