import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import pittura from '@/assets/scuole/pittura.webp'

import { SchedaScuola } from './SchedaScuola'

const meta = {
  title: 'Componenti/SchedaScuola',
  component: SchedaScuola,
  args: {
    nome: 'Pittura',
    slug: 'pittura',
    href: '/corsi?scuola=pittura',
    dipartimento: 'Dipartimento di Arti Visive',
    immagine: pittura,
    invito: 'Vedi i corsi',
  },
  decorators: [(Story) => <div style={{ maxWidth: 280 }}>{Story()}</div>],
} satisfies Meta<typeof SchedaScuola>

export default meta
type Story = StoryObj<typeof meta>

export const ConFoto: Story = {}
export const NomeLungo: Story = {
  args: {
    nome: 'Comunicazione e valorizzazione del patrimonio artistico contemporaneo',
    slug: 'comunicazione-e-valorizzazione-del-patrimonio-artistico-contemporaneo',
    dipartimento: 'Dipartimento di Comunicazione e Didattica dell’Arte',
  },
}
export const SenzaFoto: Story = { args: { immagine: null, dipartimento: null } }
