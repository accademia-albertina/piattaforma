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

const sincronizzazione = {
  inCorso: false,
  fase: 'finito' as const,
  suWordPress: 3278,
  daFare: 0,
  fatti: 0,
  nuovi: 0,
  aggiornati: 0,
  invariati: 0,
  errori: [],
  toltiDaWp: 0,
  contenutiAggiornati: 0,
  linkRiscritti: 0,
  linkNonTrovati: [],
  linkNonTrovatiTotale: 0,
  contenutiNonSalvati: [],
}

/** File da WordPress: prima importazione. */
export const WordPressDaImportare: Story = {
  args: {
    ...Collegato.args,
    esito: undefined,
    suDisco: 0,
    wordpress: { stato: sincronizzazione, importati: 0, suWordPress: 3278 },
  },
}

export const WordPressInCorso: Story = {
  args: {
    ...WordPressDaImportare.args,
    wordpress: {
      stato: { ...sincronizzazione, inCorso: true, fase: 'file', daFare: 3278, fatti: 412 },
      importati: 412,
      suWordPress: 3278,
    },
  },
}

/** Dopo una prova con 20 file. */
export const WordPressProva: Story = {
  args: {
    ...WordPressDaImportare.args,
    wordpress: {
      stato: {
        ...sincronizzazione,
        finitoIl: '2026-11-13T16:12:00.000Z',
        limite: 20,
        daFare: 20,
        fatti: 20,
        nuovi: 20,
        contenutiAggiornati: 14,
        linkRiscritti: 21,
        linkNonTrovati: [
          'https://albertina-academy.it/wp-content/uploads/2024/12/CV-Prof.ssa-Merlino.pdfdf',
        ],
        linkNonTrovatiTotale: 1,
      },
      importati: 20,
      suWordPress: 3278,
    },
  },
}
