import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import { TestataPagina } from './TestataPagina'

const meta = {
  title: 'Componenti/TestataPagina',
  component: TestataPagina,
  args: {
    occhiello: 'Studente',
    titolo: 'Segreteria didattica',
    sommario: 'Orari, richiesta e ritiro di certificati, libretti e pergamene.',
  },
} satisfies Meta<typeof TestataPagina>

export default meta
type Story = StoryObj<typeof meta>

export const Pagina: Story = {}
export const SenzaOcchiello: Story = { args: { occhiello: undefined } }
export const ConImmagine: Story = {
  args: {
    occhiello: 'Docente a contratto',
    titolo: 'Nome Cognome',
    sommario: 'Progettazione Artistica per l’Impresa',
    media: (
      <div style={{ aspectRatio: '4 / 5', background: 'var(--color-azzurro-200)' }} aria-hidden />
    ),
  },
}
