import type { Pagina } from '@/payload-types'

import type { VoceMenu } from './navigazione'

/** Forma comune dei link salvati da blocchi e menu (vedi src/fields/link.ts). */
export type LinkSalvato = {
  etichetta: string
  tipo?: 'interno' | 'percorso' | 'esterno' | null
  pagina?: number | Pagina | null
  url?: string | null
}

/** Trasforma un link salvato in una voce di menu; null se la pagina non è pubblicata o manca. */
export function risolviLink(l: LinkSalvato): VoceMenu | null {
  if (l.tipo === 'esterno') return l.url ? { label: l.etichetta, href: l.url, esterno: true } : null
  if (l.tipo === 'percorso') return l.url ? { label: l.etichetta, href: l.url } : null
  const p = l.pagina
  return p && typeof p === 'object' && p.percorso
    ? { label: l.etichetta, href: `/${p.percorso}` }
    : null
}

export const risolviLinks = (links: LinkSalvato[] | null | undefined): VoceMenu[] =>
  (links ?? []).flatMap((l) => {
    const v = risolviLink(l)
    return v ? [v] : []
  })
