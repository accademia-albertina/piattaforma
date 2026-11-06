import { nascostaA } from '@/access/pannello'
import { revalidatePath } from 'next/cache'
import type { ArrayField, GlobalConfig } from 'payload'

import { isAdmin } from '@/access/roles'
import { linkFields } from '@/fields/link'
import { rowLabel } from '@/fields/rowLabel'

const elencoLink = (
  name: string,
  label: string,
  description?: string,
  maxRows = 12,
): ArrayField => ({
  name,
  label,
  type: 'array',
  maxRows,
  labels: { singular: 'Link', plural: 'Link' },
  admin: { ...rowLabel('etichetta', 'Link'), initCollapsed: true, description },
  fields: linkFields,
})

/**
 * Menu del sito (barra in alto, mega menu, footer), modificabili dal pannello.
 * Se un elenco è vuoto il sito usa i valori predefiniti di src/lib/navigazione.ts.
 */
export const Navigazione: GlobalConfig = {
  slug: 'navigazione',
  label: 'Menu del sito',
  admin: {
    hidden: nascostaA('navigazione'),
    group: 'Impostazioni',
    description:
      'Mega menu, barra in alto e link del footer. Le modifiche sono visibili sul sito appena salvi.',
  },
  hooks: {
    // Le pagine statiche si rigenerano con il menu nuovo.
    afterChange: [
      () => {
        try {
          revalidatePath('/', 'layout')
        } catch {
          // Fuori da Next (script, test) non c'è nulla da rigenerare.
        }
      },
    ],
  },
  access: {
    read: () => true,
    update: ({ req }) => isAdmin(req.user),
  },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Mega menu',
          fields: [
            elencoLink('inEvidenza', 'In evidenza', 'Prima colonna del menu, in grande.', 8),
            {
              name: 'colonne',
              label: 'Colonne',
              type: 'array',
              maxRows: 5,
              labels: { singular: 'Colonna', plural: 'Colonne' },
              admin: {
                ...rowLabel('gruppi[].titolo', 'Colonna'),
                initCollapsed: true,
                description:
                  'Fino a 5 colonne; una colonna può contenere più gruppi uno sotto l’altro.',
              },
              fields: [
                {
                  name: 'gruppi',
                  label: 'Gruppi',
                  type: 'array',
                  minRows: 1,
                  maxRows: 3,
                  labels: { singular: 'Gruppo', plural: 'Gruppi' },
                  admin: { ...rowLabel('titolo', 'Gruppo'), initCollapsed: true },
                  fields: [
                    { name: 'titolo', label: 'Titolo del gruppo', type: 'text', required: true },
                    elencoLink('voci', 'Voci', undefined, 15),
                  ],
                },
              ],
            },
          ],
        },
        {
          label: 'Barra in alto',
          fields: [
            elencoLink('serviziSinistra', 'A sinistra', undefined, 4),
            elencoLink('serviziDestra', 'A destra', undefined, 4),
          ],
        },
        {
          label: 'Footer',
          fields: [
            elencoLink('footerLink', 'Link utili'),
            elencoLink('footerSocial', 'Social', 'Il testo del link è il nome del social.', 8),
            elencoLink('footerLegale', 'Note legali', 'Barra in fondo alla pagina.', 8),
          ],
        },
      ],
    },
  ],
}
