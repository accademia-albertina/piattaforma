import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import { Attachments } from './Attachments'

const meta = {
  title: 'Componenti/Attachments',
  component: Attachments,
  args: {
    items: [
      {
        nome: 'Calendario esami sessione invernale',
        url: '/media/calendario-esami.pdf',
        filename: 'calendario-esami.pdf',
        mimeType: 'application/pdf',
        filesize: 248_000,
      },
      {
        nome: 'Modulo di richiesta appello straordinario',
        url: '/media/modulo-appello.docx',
        filename: 'modulo-appello.docx',
        mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        filesize: 31_500,
      },
    ],
  },
} satisfies Meta<typeof Attachments>

export default meta
type Story = StoryObj<typeof meta>

export const Standard: Story = {}
export const UnSoloFile: Story = {
  args: {
    items: [
      { nome: 'Bando Erasmus+ 2027/28', url: '/media/bando.pdf', mimeType: 'application/pdf' },
    ],
  },
}
