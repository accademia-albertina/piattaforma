import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import { Documento } from './Documento'

const meta = {
  title: 'Componenti/Documento',
  component: Documento,
  args: {
    id: 'documento-1',
    nome: 'Regolamento tasse 2026-27',
    url: '/media/regolamento-tasse.pdf',
    filename: 'regolamento-tasse.pdf',
    mimeType: 'application/pdf',
    filesize: 1_250_000,
  },
} satisfies Meta<typeof Documento>

export default meta
type Story = StoryObj<typeof meta>

export const Pdf: Story = {}
export const ConDescrizione: Story = {
  args: { descrizione: 'Importi, scadenze ed esoneri approvati dal Consiglio di Amministrazione.' },
}
export const AltroFormato: Story = {
  args: {
    nome: 'Modulo di iscrizione ai corsi singoli',
    url: '/media/modulo.docx',
    filename: 'modulo.docx',
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    filesize: 31_500,
  },
}
