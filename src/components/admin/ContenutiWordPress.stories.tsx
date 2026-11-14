import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import type { EsitoRaccolta, StatoContenuti } from '@/lib/wp-import/contenuti/sincronizza-contenuti'

import ContenutiWordPress from './ContenutiWordPress'

const esito = (e: Partial<EsitoRaccolta>): EsitoRaccolta => ({
  suWordPress: 0,
  nuovi: 0,
  aggiornati: 0,
  invariati: 0,
  collegati: 0,
  protetti: 0,
  daControllare: [],
  nonPiuSuWp: [],
  nonPiuSuWpTotale: 0,
  errori: [],
  ...e,
})

const finito: StatoContenuti = {
  inCorso: false,
  fase: 'finito',
  avviatoIl: '2026-11-14T10:00:00.000Z',
  finitoIl: '2026-11-14T10:24:00.000Z',
  fatti: 128,
  daFare: 128,
  albo: esito({ suWordPress: 419, nuovi: 7, invariati: 412 }),
  trasparenza: esito({
    suWordPress: 94,
    aggiornati: 1,
    invariati: 92,
    protetti: 1,
    daControllare: ['Bilanci consuntivi (/admin/collections/trasparenza/12)'],
  }),
  avvisi: esito({
    suWordPress: 1203,
    nuovi: 120,
    invariati: 1083,
    nonPiuSuWp: ['Chiusura Biblioteca 13/11 (/admin/collections/avvisi/507)'],
    nonPiuSuWpTotale: 1,
  }),
  pagineModificate: [
    {
      titolo: 'Modulistica',
      url: 'https://albertina-academy.it/studente/modulistica/',
      modificato: '2026-11-07T18:32:13.000Z',
    },
  ],
  fileImportati: 59,
  errori: [],
}

const meta = {
  title: 'Pannello/Contenuti da WordPress',
  component: ContenutiWordPress,
  args: { stato: finito, collegati: { albo: 419, trasparenza: 94, avvisi: 1203 }, attivo: true },
  decorators: [
    (Story) => (
      <div style={{ maxWidth: 880 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof ContenutiWordPress>

export default meta
type Story = StoryObj<typeof meta>

export const UltimaSincronizzazione: Story = {}

export const InCorso: Story = {
  args: { stato: { ...finito, inCorso: true, fase: 'avvisi', fatti: 40, daFare: 120 } },
}

export const MaiAvviata: Story = {
  args: {
    stato: { ...finito, finitoIl: undefined, avviatoIl: undefined },
    collegati: { albo: 0, trasparenza: 0, avvisi: 0 },
  },
}
