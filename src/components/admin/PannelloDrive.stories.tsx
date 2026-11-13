import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import PannelloDrive from './PannelloDrive'

const fermo = { inCorso: false, totale: 0, spostati: 0, mancanti: [], errori: [] }

const meta = {
  title: 'Pannello/Google Drive',
  component: PannelloDrive,
  args: {
    account: 'noreply@albertina.academy',
    configurato: true,
    mancanti: [],
    collegato: false,
    idCartella: '1So7xQe4Htkw5lJ7STmZY21BITrIMgh1a',
    cartella: {},
    suDisco: 42,
    spostamento: fermo,
  },
  decorators: [
    (Story) => (
      <div style={{ maxWidth: 880 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof PannelloDrive>

export default meta
type Story = StoryObj<typeof meta>

/** Prima volta: variabili su Render, Drive ancora da collegare. */
export const DaCollegare: Story = {}

export const Collegato: Story = {
  args: {
    collegato: true,
    email: 'noreply@albertina.academy',
    collegatoIl: '2026-11-13T11:05:00.000Z',
    collegatoDa: 'new@albertina.academy',
    cartella: { nome: 'Sito Albertina – file', condiviso: false },
    esito: 'collegato',
  },
}

export const SpostamentoInCorso: Story = {
  args: {
    ...Collegato.args,
    esito: undefined,
    spostamento: { ...fermo, inCorso: true, totale: 42, spostati: 17 },
  },
}

/** Permesso revocato da Google: si ricollega. */
export const DaRicollegare: Story = {
  args: {
    ...Collegato.args,
    esito: undefined,
    erroreCollegamento:
      'Google non accetta più il collegamento (permesso revocato o password cambiata).',
  },
}

export const AccountSbagliato: Story = { args: { errore: 'account' } }

export const NonConfigurato: Story = {
  args: { configurato: false, mancanti: ['GOOGLE_DRIVE_CLIENT_ID', 'DRIVE_ID'] },
}
