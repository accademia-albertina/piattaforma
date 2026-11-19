import type { GruppoAmmissioni } from '@/lib/avvisi-ammissioni'

const testo = (t: string) =>
  ({
    root: {
      type: 'root',
      format: '',
      indent: 0,
      version: 1,
      direction: 'ltr',
      children: [
        {
          type: 'paragraph',
          format: '',
          indent: 0,
          version: 1,
          direction: 'ltr',
          textFormat: 0,
          children: [
            { type: 'text', text: t, format: 0, mode: 'normal', style: '', detail: 0, version: 1 },
          ],
        },
      ],
    },
  }) as never

/** Dati di esempio per Storybook e test. */
export const GRUPPI_ESEMPIO: GruppoAmmissioni[] = [
  {
    scuola: { id: 10, nome: 'Cinema, Fotografia e Audiovisivo', slug: 'cinema' },
    avvisi: [
      {
        id: 1,
        titolo: 'Esiti della prova pratica',
        pubblicatoIl: '2026-09-12T08:00:00.000Z',
        contenuto: testo(
          'Gli esiti sono affissi in portineria. Colloqui il 16 settembre alle 9:30.',
        ),
        allegati: [
          {
            nome: 'Calendario dei colloqui',
            url: '/media/calendario-colloqui.pdf',
            filename: 'calendario-colloqui.pdf',
            mimeType: 'application/pdf',
            filesize: 120_000,
          },
        ],
      },
    ],
  },
  {
    scuola: { id: 1, nome: 'Pittura', slug: 'pittura' },
    avvisi: [
      {
        id: 2,
        titolo: 'Avviso a integrazione',
        pubblicatoIl: '2026-09-10T08:00:00.000Z',
        contenuto: testo(
          'È stato pubblicato un avviso a integrazione per gli esami di ammissione.',
        ),
        allegati: [],
      },
    ],
  },
]
