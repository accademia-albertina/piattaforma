import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import { AvvisiAmmissioni } from './AvvisiAmmissioni'
import { GRUPPI_ESEMPIO } from './esempio'

const meta: Meta<typeof AvvisiAmmissioni> = {
  title: 'Componenti/AvvisiAmmissioni',
  component: AvvisiAmmissioni,
}
export default meta

export const ConAvvisi: StoryObj<typeof AvvisiAmmissioni> = { args: { gruppi: GRUPPI_ESEMPIO } }

export const Vuoto: StoryObj<typeof AvvisiAmmissioni> = { args: { gruppi: [] } }
