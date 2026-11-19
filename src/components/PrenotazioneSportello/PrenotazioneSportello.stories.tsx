import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import { PrenotazioneSportello } from './PrenotazioneSportello'

const turni = (data: string, occupati: number[] = []) =>
  ['10:00', '10:05', '10:10', '10:15', '10:20', '10:25'].map((ora, i) => ({
    ora,
    inizio: `${data}T${String(9 + Number(ora.slice(0, 2)) - 10).padStart(2, '0')}:${ora.slice(3)}:00.000Z`,
    liberi: occupati.includes(i) ? 0 : 1,
  }))

const giorni = [
  { data: '2026-11-20', turni: turni('2026-11-20', [0, 1, 3]), liberi: 3 },
  { data: '2026-11-23', turni: turni('2026-11-23', [0, 1, 2, 3, 4, 5]), liberi: 0 },
  { data: '2026-11-27', turni: turni('2026-11-27'), liberi: 6 },
]

const meta = {
  title: 'Componenti/PrenotazioneSportello',
  component: PrenotazioneSportello,
  args: {
    utente: { tipo: 'anonimo' },
    accessoHref: '/admin/login',
    attivo: true,
    documenti: [
      { id: 'a', nome: 'Libretto' },
      { id: 'b', nome: 'Pergamena di laurea', descrizione: 'Porta la ricevuta del pagamento.' },
      { id: 'c', nome: 'Certificato sostitutivo di diploma' },
    ],
    giorni,
  },
} satisfies Meta<typeof PrenotazioneSportello>

export default meta
type Story = StoryObj<typeof meta>

export const SenzaAccount: Story = {}
export const Studente: Story = {
  args: {
    utente: { tipo: 'account', nominativo: 'Giulia Bianchi', dettaglio: 'matricola 12345' },
    appuntamenti: [{ id: 1, documento: 'Libretto', inizio: '2026-11-27T09:10:00.000Z' }],
  },
}
export const Sospese: Story = { args: { attivo: false } }
export const NessunTurno: Story = { args: { giorni: [] } }
