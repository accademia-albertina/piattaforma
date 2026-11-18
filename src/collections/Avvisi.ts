import { filtroElenco, filtroPannello, nascostaA } from '@/access/pannello'
import type {
  Access,
  CollectionBeforeValidateHook,
  CollectionConfig,
  RelationshipFieldSingleValidation,
  Where,
} from 'payload'

import type { Avviso } from '@/payload-types'

import {
  CATEGORIA_AMMISSIONI,
  CATEGORIA_LABELS,
  CATEGORIE_AVVISI,
  categorieConsentite,
  categorieNonConsentite,
  gestisceTutteLeAmmissioni,
  puoScrivereAvvisi,
  scuoleCoordinate,
} from '@/access/avvisi'
import { canAccessBackend, isAdmin } from '@/access/roles'
import { rowLabel } from '@/fields/rowLabel'
import { slugField } from '@/fields/slug'
import { campiProvenienzaWp, segnaModificaNelPannello } from '@/fields/provenienzaWp'
import { validaTitolo } from '@/fields/titolo'
import { linkSulSito } from '@/fields/linkSulSito'

/** Il pubblico vede solo gli avvisi pubblicati; chi lavora nel pannello vede anche le bozze. */
const read: Access = ({ req }) => {
  if (canAccessBackend(req.user)) return true
  return { _status: { equals: 'published' } } satisfies Where
}

/** Si modifica un avviso solo se tutte le sue categorie rientrano tra quelle del proprio ruolo. */
const updateOrDelete: Access = ({ req }) => {
  if (!req.user) return false
  if (isAdmin(req.user)) return true
  if (!puoScrivereAvvisi(req.user)) return false
  const categorie: Where = { categorie: { not_in: categorieNonConsentite(req.user) } }
  // Il docente modifica solo gli avvisi che ha scritto lui (e il coordinatore anche quelli
  // di ammissione della sua scuola, scritti dal coordinatore precedente)
  const suoi = filtroPannello(req.user, 'avvisi')
  return suoi ? { and: [categorie, suoi] } : categorie
}

/**
 * Avvisi di ammissione: categoria esclusiva, sempre con una scuola. Il coordinatore scrive solo
 * per la sua scuola, che si imposta da sola; admin e vicedirezione scelgono la scuola.
 */
const regoleAmmissioni: CollectionBeforeValidateHook<Avviso> = ({ data, req }) => {
  if (!data?.categorie?.includes(CATEGORIA_AMMISSIONI)) return data
  if (!req.user || gestisceTutteLeAmmissioni(req.user)) return data
  const mie = scuoleCoordinate(req.user)
  const scelte = (data.scuole ?? [])
    .map((s) => (typeof s === 'object' && s ? s.id : s))
    .filter((id) => mie.includes(id as number))
  // Con una sola scuola coordinata non c'è niente da scegliere
  data.scuole = scelte.length > 0 ? scelte : mie.length === 1 ? [mie[0]] : scelte
  return data
}

const validaScuole: RelationshipFieldSingleValidation = (value, { data, req }) => {
  const categorie = (data as Partial<Avviso>)?.categorie ?? []
  if (!categorie.includes(CATEGORIA_AMMISSIONI)) return true
  const ids = ((value as unknown[] | null | undefined) ?? []).map((s) =>
    typeof s === 'object' && s ? (s as { id: number }).id : (s as number),
  )
  if (ids.length === 0) return 'Gli avvisi di ammissione devono indicare la scuola.'
  if (!req.user || gestisceTutteLeAmmissioni(req.user)) return true
  const mie = scuoleCoordinate(req.user)
  return ids.every((id) => mie.includes(id))
    ? true
    : 'Puoi pubblicare avvisi di ammissione solo per la scuola che coordini.'
}

export const Avvisi: CollectionConfig = {
  slug: 'avvisi',
  labels: { singular: 'Avviso', plural: 'Avvisi' },
  typescript: { interface: 'Avviso' },
  admin: {
    hidden: nascostaA('avvisi'),
    baseFilter: filtroElenco('avvisi'),
    useAsTitle: 'titolo',
    description:
      'Comunicazioni per studenti e docenti, in /avvisi e in homepage. Gli avvisi di Ammissioni vanno nella pagina Ammissioni e in /avvisi, non in homepage.',
    defaultColumns: ['titolo', 'categorie', 'pubblicatoIl', '_status'],
    group: 'Contenuti',
    listSearchableFields: ['titolo', 'sommario'],
  },
  defaultSort: '-pubblicatoIl',
  versions: { drafts: true, maxPerDoc: 20 },
  access: {
    read,
    create: ({ req }) => puoScrivereAvvisi(req.user),
    update: updateOrDelete,
    delete: updateOrDelete,
  },
  hooks: { beforeValidate: [regoleAmmissioni], beforeChange: [segnaModificaNelPannello] },
  fields: [
    linkSulSito('/avvisi/'),
    {
      name: 'titolo',
      label: 'Titolo',
      type: 'text',
      required: true,
      maxLength: 160,
      validate: validaTitolo,
    },
    {
      name: 'sommario',
      label: 'Sommario',
      type: 'textarea',
      maxLength: 240,
      admin: {
        description:
          'Una o due frasi mostrate negli elenchi e nei risultati di Google. Se vuoto si usa l’inizio del testo.',
      },
    },
    {
      name: 'categorie',
      label: 'Categorie',
      type: 'select',
      hasMany: true,
      required: true,
      index: true,
      options: CATEGORIE_AVVISI.map((value) => ({ value, label: CATEGORIA_LABELS[value] })),
      // Nel pannello ognuno vede solo le categorie del proprio ruolo…
      filterOptions: ({ options, req }) => {
        const ok = new Set<string>(categorieConsentite(req.user))
        return options.filter((o) => ok.has(typeof o === 'string' ? o : o.value))
      },
      // …e il server rifiuta comunque le altre.
      validate: (value, { req }) => {
        if (!value || (Array.isArray(value) && value.length === 0))
          return 'Scegli almeno una categoria.'
        if (!req.user) return true
        const scelte = value as string[]
        if (scelte.includes(CATEGORIA_AMMISSIONI) && scelte.length > 1)
          return 'Ammissioni non si combina con altre categorie: toglile.'
        if (!req.user) return true
        const ok = new Set<string>(categorieConsentite(req.user))
        const vietate = scelte.filter((v) => !ok.has(v))
        return vietate.length === 0
          ? true
          : `Il tuo ruolo non può pubblicare in: ${vietate.map((v) => CATEGORIA_LABELS[v as keyof typeof CATEGORIA_LABELS] ?? v).join(', ')}.`
      },
      admin: {
        position: 'sidebar',
        description:
          'Ammissioni: solo coordinatori di scuola e vicedirezione. L’avviso compare nella pagina Ammissioni, sotto la sua scuola, e in /avvisi (non in homepage).',
      },
    },
    {
      name: 'scuole',
      label: 'Scuole',
      type: 'relationship',
      relationTo: 'scuole',
      hasMany: true,
      validate: validaScuole as never,
      // Il coordinatore, per gli avvisi di ammissione, vede solo le scuole che coordina
      filterOptions: ({ data, req }) =>
        Array.isArray(data?.categorie) &&
        data.categorie.includes(CATEGORIA_AMMISSIONI) &&
        req.user &&
        !gestisceTutteLeAmmissioni(req.user)
          ? { id: { in: scuoleCoordinate(req.user) } }
          : true,
      admin: {
        position: 'sidebar',
        description:
          'Lascia vuoto se l’avviso riguarda tutta l’Accademia. Per Ammissioni è obbligatoria (per i coordinatori si imposta da sola).',
      },
    },
    {
      name: 'visibileFinoAl',
      label: 'Visibile fino al',
      type: 'date',
      admin: {
        position: 'sidebar',
        description:
          'Facoltativa. Dopo questo giorno l’avviso sparisce dalla pagina Ammissioni (resta in /avvisi).',
        date: { pickerAppearance: 'dayOnly', displayFormat: 'd MMM yyyy' },
        condition: (data) =>
          Array.isArray(data?.categorie) && data.categorie.includes(CATEGORIA_AMMISSIONI),
      },
    },
    {
      name: 'pubblicatoIl',
      label: 'Data di pubblicazione',
      type: 'date',
      required: true,
      index: true,
      defaultValue: () => new Date().toISOString(),
      admin: {
        position: 'sidebar',
        date: {
          pickerAppearance: 'dayAndTime',
          displayFormat: 'd MMM yyyy, HH:mm',
          timeFormat: 'HH:mm',
          overrides: { timeCaption: 'Ora' },
        },
      },
    },
    {
      name: 'immagine',
      label: 'Immagine',
      type: 'upload',
      relationTo: 'media',
      filterOptions: { mimeType: { contains: 'image' } },
      admin: {
        description:
          'Facoltativa. Per gli avvisi In evidenza è lo sfondo dello slider in homepage (formato orizzontale, almeno 1920 px).',
      },
    },
    { name: 'contenuto', label: 'Testo', type: 'richText' },
    {
      name: 'allegati',
      label: 'Allegati',
      type: 'array',
      labels: { singular: 'Allegato', plural: 'Allegati' },
      admin: rowLabel('nome', 'Allegato'),
      fields: [
        {
          name: 'nome',
          label: 'Nome mostrato',
          type: 'text',
          required: true,
          admin: {
            description: 'Descrivi il documento, es. “Calendario esami sessione invernale”.',
          },
        },
        { name: 'file', label: 'File', type: 'upload', relationTo: 'media', required: true },
      ],
    },
    slugField('titolo'),
    {
      name: 'autore',
      label: 'Autore',
      type: 'relationship',
      relationTo: 'users',
      admin: { position: 'sidebar', readOnly: true },
      access: { update: ({ req }) => isAdmin(req.user) },
      hooks: {
        beforeChange: [
          ({ value, operation, req }) => (operation === 'create' && req.user ? req.user.id : value),
        ],
      },
    },
    campiProvenienzaWp,
  ],
}
