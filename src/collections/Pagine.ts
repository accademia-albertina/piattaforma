import type {
  CollectionAfterChangeHook,
  CollectionBeforeChangeHook,
  CollectionConfig,
} from 'payload'

import {
  UFFICI_PAGINE,
  creaPagine,
  eliminaPagine,
  isRedattorePagine,
  leggiPagine,
  modificaPagine,
} from '@/access/pagine'
import { ROLE_LABELS } from '@/access/roles'
import { BLOCCHI } from '@/blocks'
import { slugField } from '@/fields/slug'
import { validaTitolo } from '@/fields/titolo'

/** Indirizzi già usati da pagine fisse del sito: una pagina di primo livello non può prenderli. */
export const SLUG_RISERVATI = [
  'admin',
  'api',
  'avvisi',
  'cerca',
  'corsi',
  'docenti',
  'next',
  'brand',
  'media',
]

const idDi = (v: unknown) =>
  (v && typeof v === 'object' ? (v as { id: number }).id : v) as number | null | undefined

/** Calcola il percorso completo (es. accademia/storia) a partire dalla pagina genitore. */
const calcolaPercorso: CollectionBeforeChangeHook = async ({ data, req, originalDoc }) => {
  const genitoreId = idDi(data.genitore)
  if (!genitoreId) {
    data.percorso = data.slug
    return data
  }
  const genitore = await req.payload.findByID({
    collection: 'pagine',
    id: genitoreId,
    depth: 0,
    draft: true,
    req,
    overrideAccess: true,
  })
  const proprio = originalDoc?.percorso as string | undefined
  if (
    genitoreId === originalDoc?.id ||
    (proprio && (genitore.percorso === proprio || genitore.percorso?.startsWith(`${proprio}/`)))
  ) {
    throw new Error('Una pagina non può stare dentro se stessa o dentro una sua sottopagina.')
  }
  data.percorso = `${genitore.percorso}/${data.slug}`
  return data
}

/** Se cambia il percorso, si aggiornano a cascata le sottopagine. */
const aggiornaSottopagine: CollectionAfterChangeHook = async ({ doc, previousDoc, req }) => {
  if (!previousDoc?.percorso || previousDoc.percorso === doc.percorso) return doc
  const figlie = await req.payload.find({
    collection: 'pagine',
    where: { genitore: { equals: doc.id } },
    depth: 0,
    limit: 500,
    draft: true,
    req,
    overrideAccess: true,
  })
  for (const figlia of figlie.docs) {
    await req.payload.update({
      collection: 'pagine',
      id: figlia.id,
      data: {},
      req,
      overrideAccess: true,
    })
  }
  return doc
}

const slug = slugField('titolo')

export const Pagine: CollectionConfig = {
  slug: 'pagine',
  labels: { singular: 'Pagina', plural: 'Pagine' },
  typescript: { interface: 'Pagina' },
  admin: {
    useAsTitle: 'titolo',
    description: 'Pagine istituzionali composte a blocchi, come Didattica o Ammissioni.',
    defaultColumns: ['titolo', 'percorso', 'updatedAt', '_status'],
    group: 'Contenuti',
    listSearchableFields: ['titolo', 'percorso'],
    preview: (doc) => (doc?.percorso ? `/${doc.percorso}` : null),
  },
  defaultSort: 'percorso',
  versions: { drafts: true, maxPerDoc: 30 },
  access: {
    read: leggiPagine,
    create: creaPagine,
    update: modificaPagine,
    delete: eliminaPagine,
  },
  hooks: {
    beforeChange: [calcolaPercorso],
    afterChange: [aggiornaSottopagine],
  },
  fields: [
    {
      name: 'titolo',
      label: 'Titolo',
      type: 'text',
      required: true,
      maxLength: 120,
      validate: validaTitolo,
    },
    {
      name: 'sommario',
      label: 'Sommario',
      type: 'textarea',
      maxLength: 240,
      admin: {
        description:
          'Una o due frasi sotto il titolo; si usano anche nei risultati di Google e nelle anteprime social.',
      },
    },
    {
      name: 'blocchi',
      label: 'Contenuto',
      type: 'blocks',
      blocks: BLOCCHI,
      labels: { singular: 'Blocco', plural: 'Blocchi' },
      admin: { initCollapsed: false },
    },
    {
      ...slug,
      validate: (value: unknown, { siblingData }: { siblingData: { genitore?: unknown } }) =>
        !siblingData?.genitore && typeof value === 'string' && SLUG_RISERVATI.includes(value)
          ? `“${value}” è già usato dal sito: scegli un altro indirizzo.`
          : true,
    },
    {
      name: 'genitore',
      label: 'Pagina genitore',
      type: 'relationship',
      relationTo: 'pagine',
      index: true,
      filterOptions: ({ id }) => (id ? { id: { not_equals: id } } : true),
      admin: {
        position: 'sidebar',
        description: 'Determina indirizzo e briciole di pane, es. Accademia › Storia.',
      },
    },
    {
      name: 'percorso',
      label: 'Indirizzo completo',
      type: 'text',
      index: true,
      admin: { position: 'sidebar', readOnly: true },
    },
    {
      name: 'ufficiEditori',
      label: 'Uffici che possono modificarla',
      type: 'select',
      hasMany: true,
      options: UFFICI_PAGINE.map((value) => ({ value, label: ROLE_LABELS[value] })),
      access: {
        create: ({ req }) => isRedattorePagine(req.user),
        update: ({ req }) => isRedattorePagine(req.user),
      },
      admin: {
        position: 'sidebar',
        description:
          'Oltre a redazione e vicedirezione. Es. la pagina Iscrizioni alla Segreteria didattica.',
      },
    },
  ],
}
