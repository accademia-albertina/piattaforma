import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import { IscrizioneCorso } from '../IscrizioneCorso/IscrizioneCorso'

import { SchedaAppello } from './SchedaAppello'

const meta = {
  title: 'Componenti/SchedaAppello',
  component: SchedaAppello,
  args: {
    titolo: 'Storia dell’arte contemporanea',
    giorno: 'martedì 22 settembre 2026',
    ora: '10:00',
    aula: 'C28',
    livelli: 'Biennio',
    docenti: 'Bernardelli Francesca',
    commissione: 'Bernardelli, Bertolino, Ajani',
  },
} satisfies Meta<typeof SchedaAppello>

export default meta
type Story = StoryObj<typeof meta>

export const Semplice: Story = {}
export const ConIscrizione: Story = {
  args: {
    note: 'Per chi non ha sostenuto l’esame il 22/09.',
    children: (
      <IscrizioneCorso
        compatto
        tipo="esame"
        idRiferimento={1}
        stato="aperta"
        chiusura="21 settembre 2026, 00:00"
        utente="studente"
      />
    ),
  },
}
