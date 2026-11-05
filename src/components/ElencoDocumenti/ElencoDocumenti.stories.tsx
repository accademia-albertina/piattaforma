import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import { ElencoDocumenti } from './ElencoDocumenti'

const meta = {
  title: 'Componenti/ElencoDocumenti',
  component: ElencoDocumenti,
  args: {
    documenti: [
      { nome: 'Bando di selezione – scadenza 18/12/2026', url: '/uploads/2026/11/bando.pdf' },
      { nome: 'Nomina della commissione', url: '/uploads/2026/12/nomina.pdf' },
      { nome: 'Piattaforma per le domande', url: 'https://example.org/domande' },
    ],
  },
} satisfies Meta<typeof ElencoDocumenti>

export default meta
type Story = StoryObj<typeof meta>

export const Standard: Story = {}
export const Compatto: Story = { args: { compatto: true } }
export const ConNote: Story = {
  args: {
    documenti: [
      {
        nome: 'Bilancio di previsione 2026',
        url: '/uploads/2026/01/bilancio.pdf',
        nota: 'Approvato dal Consiglio di amministrazione il 18 dicembre 2025.',
      },
    ],
  },
}
