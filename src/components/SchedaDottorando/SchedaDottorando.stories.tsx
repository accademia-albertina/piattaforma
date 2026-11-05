import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import { SchedaDottorando } from './SchedaDottorando'

const meta = {
  title: 'Componenti/SchedaDottorando',
  component: SchedaDottorando,
  args: {
    nome: 'Paola Pietronave',
    href: '/dottorati/albertina/dottorandi/paola-pietronave',
    dettaglio: 'Ricerca e critica dei processi espositivi contemporanei',
    progetto:
      'Lumbung Italia: laboratorio e campo di ricerca per pratiche artistiche e curatoriali collettive',
  },
  decorators: [(Story) => <div style={{ maxWidth: 320 }}>{Story()}</div>],
} satisfies Meta<typeof SchedaDottorando>

export default meta
type Story = StoryObj<typeof meta>

export const SenzaFoto: Story = {}
export const ConFoto: Story = {
  args: { foto: { url: '/brand/stemma-favicon-192.png', width: 192, height: 192 } },
}
export const SoloNome: Story = { args: { dettaglio: null, progetto: null } }
