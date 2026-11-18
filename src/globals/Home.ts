import { revalidatePath } from 'next/cache'
import type { Field, GlobalConfig } from 'payload'

import { nascostaA, vedeSezione } from '@/access/pannello'
import { linkFields } from '@/fields/link'
import { rowLabel } from '@/fields/rowLabel'
import { HOME_PREDEFINITA as P, ICONE_HOME } from '@/lib/home'

/** Destinazione del link senza il testo: negli accessi rapidi il testo è il titolo. */
const destinazione = linkFields.filter((f) => 'name' in f && f.name !== 'etichetta')

const foto = (name: string, label: string, description: string): Field => ({
  name,
  label,
  type: 'upload',
  relationTo: 'media',
  filterOptions: { mimeType: { contains: 'image' } },
  admin: { description },
})

/**
 * Contenuti della homepage modificabili dal pannello. I valori iniziali sono quelli di
 * src/lib/home.ts; un campo lasciato vuoto torna al valore predefinito.
 * Lo slider mostra gli avvisi "in evidenza": si scelgono dal singolo avviso.
 */
export const Home: GlobalConfig = {
  slug: 'home',
  label: 'Home',
  admin: {
    hidden: nascostaA('home'),
    group: 'Impostazioni',
    description:
      'Testi, collegamenti e foto della homepage. Le modifiche sono visibili sul sito appena salvi.',
  },
  hooks: {
    afterChange: [
      () => {
        try {
          revalidatePath('/')
        } catch {
          // Fuori da Next (script, test) non c'è nulla da rigenerare.
        }
      },
    ],
  },
  access: {
    read: () => true,
    update: ({ req }) => vedeSezione(req.user, 'home'),
  },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Slider',
          description:
            'Lo slider in cima mostra gli avvisi “in evidenza”: per aggiungerne uno apri l’avviso e aggiungi la categoria “In evidenza”.',
          fields: [
            {
              name: 'sliderNumero',
              label: 'Quanti avvisi mostrare',
              type: 'number',
              min: 1,
              max: 8,
              defaultValue: P.slider.numero,
              admin: { step: 1 },
            },
          ],
        },
        {
          label: 'Accessi rapidi',
          fields: [
            {
              name: 'accessiTitolo',
              label: 'Titolo',
              type: 'text',
              defaultValue: P.accessiTitolo,
            },
            {
              name: 'accessiTesto',
              label: 'Testo',
              type: 'textarea',
              defaultValue: P.accessiTesto,
            },
            {
              name: 'accessi',
              label: 'Collegamenti',
              type: 'array',
              minRows: 2,
              maxRows: 6,
              labels: { singular: 'Collegamento', plural: 'Collegamenti' },
              defaultValue: P.accessi,
              admin: {
                ...rowLabel('titolo', 'Collegamento'),
                initCollapsed: true,
                description: 'Da 2 a 6 riquadri sotto lo slider.',
              },
              fields: [
                { name: 'titolo', label: 'Titolo', type: 'text', required: true },
                { name: 'testo', label: 'Descrizione breve', type: 'text', required: true },
                {
                  name: 'icona',
                  label: 'Icona',
                  type: 'select',
                  required: true,
                  defaultValue: 'info',
                  options: ICONE_HOME.map((i) => ({ value: i.value, label: i.label })),
                },
                ...destinazione,
              ],
            },
          ],
        },
        {
          label: 'Presentazione',
          fields: [
            {
              name: 'manifesto',
              label: 'Testo del manifesto',
              type: 'textarea',
              defaultValue: P.manifesto,
              admin: { description: 'Le parole si accendono una alla volta mentre si scorre.' },
            },
            foto(
              'fotoGrande',
              'Foto grande',
              'Si apre dietro il motto. Se vuota: lo scalone. Meglio orizzontale, almeno 2000 px.',
            ),
            {
              name: 'fotoDettagli',
              label: 'Foto piccole',
              type: 'upload',
              relationTo: 'media',
              hasMany: true,
              minRows: 2,
              maxRows: 2,
              filterOptions: { mimeType: { contains: 'image' } },
              admin: {
                description: 'Due foto accanto al manifesto. Se vuoto: sala blu e aula di pittura.',
              },
            },
            {
              name: 'cifre',
              label: 'Cifre',
              type: 'array',
              maxRows: 4,
              labels: { singular: 'Cifra', plural: 'Cifre' },
              defaultValue: P.cifre,
              admin: { ...rowLabel('etichetta', 'Cifra'), initCollapsed: true },
              fields: [
                {
                  type: 'row',
                  fields: [
                    { name: 'valore', label: 'Numero', type: 'number', required: true, min: 0 },
                    { name: 'etichetta', label: 'Etichetta', type: 'text', required: true },
                  ],
                },
              ],
            },
          ],
        },
        {
          label: 'Scuole',
          description:
            'Il riquadro che apre l’elenco delle scuole. Le scuole si modificano da “Scuole”.',
          fields: [
            { name: 'scuoleTitolo', label: 'Titolo', type: 'text', defaultValue: P.scuoleTitolo },
            { name: 'scuoleTesto', label: 'Testo', type: 'textarea', defaultValue: P.scuoleTesto },
          ],
        },
        {
          label: 'Avviso',
          description:
            'Riquadro informativo dopo le scuole, per un messaggio a tutti i visitatori.',
          fields: [
            {
              name: 'avvisoMostra',
              label: 'Mostra il riquadro',
              type: 'checkbox',
              defaultValue: P.avviso.mostra,
            },
            {
              name: 'avvisoTitolo',
              label: 'Titolo',
              type: 'text',
              defaultValue: P.avviso.titolo,
              admin: { condition: (_, s) => Boolean(s?.avvisoMostra) },
            },
            {
              name: 'avvisoTesto',
              label: 'Testo',
              type: 'textarea',
              defaultValue: P.avviso.testo,
              admin: { condition: (_, s) => Boolean(s?.avvisoMostra) },
            },
          ],
        },
        {
          label: 'Visita virtuale',
          fields: [
            { name: 'tourTitolo', label: 'Titolo', type: 'text', defaultValue: P.tour.titolo },
            { name: 'tourTesto', label: 'Testo', type: 'textarea', defaultValue: P.tour.testo },
            {
              name: 'tourUrl',
              label: 'Indirizzo del tour',
              type: 'text',
              defaultValue: P.tour.url,
              validate: (v: unknown) =>
                !v || (typeof v === 'string' && /^https:\/\/\S+$/.test(v))
                  ? true
                  : 'Inserisci un indirizzo completo che inizi con https://',
            },
            foto(
              'tourFoto',
              'Foto di sfondo',
              'Se vuota: la facciata. Orizzontale, almeno 2000 px.',
            ),
          ],
        },
      ],
    },
  ],
}
