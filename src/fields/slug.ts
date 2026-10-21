import type { CollectionSlug, TextField } from 'payload'

import { slugify } from '@/utilities/slugify'

/**
 * Campo slug generato dal campo indicato se lasciato vuoto.
 * Se lo slug è già usato da un altro documento aggiunge -2, -3… (gli avvisi hanno spesso titoli uguali).
 */
export function slugField(fromField = 'title'): TextField {
  return {
    name: 'slug',
    label: 'Indirizzo (slug)',
    type: 'text',
    index: true,
    unique: true,
    admin: {
      position: 'sidebar',
      description: 'Si genera dal titolo. Cambialo solo se serve un indirizzo diverso.',
    },
    hooks: {
      beforeValidate: [
        async ({ value, data, req, collection, originalDoc }) => {
          const source = typeof value === 'string' && value.trim() ? value : data?.[fromField]
          if (typeof source !== 'string' || !collection) return value
          const base = slugify(source) || 'senza-titolo'
          let candidate = base
          for (let n = 2; n < 100; n++) {
            const { totalDocs } = await req.payload.count({
              collection: collection.slug as CollectionSlug,
              where: {
                slug: { equals: candidate },
                ...(originalDoc?.id ? { id: { not_equals: originalDoc.id } } : {}),
              },
              req,
            })
            if (totalDocs === 0) return candidate
            candidate = `${base}-${n}`
          }
          return `${base}-${Date.now()}`
        },
      ],
    },
  }
}
