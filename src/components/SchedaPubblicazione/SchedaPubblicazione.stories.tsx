import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import { SchedaPubblicazione } from './SchedaPubblicazione'

const meta = {
  title: 'Componenti/SchedaPubblicazione',
  component: SchedaPubblicazione,
  args: {
    titolo: 'Polvere e luce. La Gipsoteca dell’Accademia Albertina di Belle Arti di Torino',
    href: '/accademia/albertina-press/polvere-e-luce',
    collana: 'Galleria',
    anno: 2026,
    copertina: { url: '/brand/stemma-favicon-192.png', width: 192, height: 192 },
  },
  decorators: [(Story) => <div style={{ maxWidth: 260 }}>{Story()}</div>],
} satisfies Meta<typeof SchedaPubblicazione>

export default meta
type Story = StoryObj<typeof meta>

export const ConCopertina: Story = {}
export const SenzaCopertina: Story = { args: { copertina: null } }
