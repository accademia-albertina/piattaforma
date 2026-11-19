import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import { Attachments } from '../Attachments/Attachments'
import { Visualizzatore } from './Visualizzatore'

/**
 * Il visualizzatore è montato una volta nel layout e si apre col clic sui link con
 * `data-anteprima` (Attachments, ElencoDocumenti, Documento, gallerie, testi).
 * Qui: un elenco di allegati con due immagini del sito e un PDF inesistente, per vedere
 * anche il messaggio d'errore con le alternative (Scarica, Apri in una nuova scheda).
 */
const meta = {
  title: 'Componenti/Visualizzatore',
  component: Visualizzatore,
  parameters: { layout: 'padded' },
  render: () => (
    <>
      <Attachments
        items={[
          {
            nome: 'Stemma dell’Accademia',
            url: '/design-system/stemma-albertina.png',
            mimeType: 'image/png',
          },
          {
            nome: 'Logo dell’Accademia',
            url: '/design-system/logo-albertina.png',
            mimeType: 'image/png',
          },
          {
            nome: 'Documento mancante (errore)',
            url: '/media/mancante.pdf',
            mimeType: 'application/pdf',
            filesize: 120_000,
          },
        ]}
      />
      <Visualizzatore />
    </>
  ),
} satisfies Meta<typeof Visualizzatore>

export default meta
type Story = StoryObj<typeof meta>

export const ElencoConAnteprima: Story = {}
