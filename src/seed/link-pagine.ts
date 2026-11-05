import type { Payload } from 'payload'

import type { Navigazione } from '@/payload-types'

/**
 * Indirizzi provvisori del menu → indirizzi veri delle pagine importate dal sito attuale
 * (gli stessi di albertina-academy.it, così i link esterni e i motori di ricerca non si rompono).
 */
export const PERCORSI_PAGINE: Record<string, { url: string; etichetta?: string }> = {
  '/accademia/saluto-del-direttore': { url: '/accademia/il-saluto-del-direttore' },
  '/didattica/offerta-formativa': {
    url: '/didattica/piani-di-studio',
    etichetta: 'Piani di studio',
  },
  '/studenti/segreteria': { url: '/studente/segreteria-didattica' },
  '/studenti/stage-e-tirocinio': { url: '/studente/stage-tirocinio' },
  '/studenti/modulistica': { url: '/studente/modulistica' },
  '/studenti/tasse': { url: '/studente/tasse' },
  '/studenti/consulta': { url: '/studente/consulta' },
  '/studenti/tesi': { url: '/studente/tesi' },
  '/studenti/borse-di-studio': { url: '/studente/borse-di-studio' },
  '/studenti/sportelli': { url: '/studente/sportelli' },
  '/studenti/tutoraggio-interculturale': { url: '/studente/tutoraggio-interculturale' },
  '/privacy': { url: '/privacy-policy' },
  '/cookie': { url: '/cookie-policy' },
  '/note-legali': { url: '/termini-e-condizioni' },
  '/segnalazioni-accessibilita': { url: '/segnalazioni-di-accessibilita' },
}

type Voce = NonNullable<Navigazione['footerLink']>[number]

function sistema(voci: Voce[] | null | undefined) {
  let cambiato = false
  const nuove = (voci ?? []).map((v) => {
    const nuovo =
      v.tipo === 'percorso' &&
      v.url === '/dottorati' &&
      v.etichetta === 'Dottorati Accademia Albertina'
        ? { url: '/dottorati/albertina' }
        : v.tipo === 'percorso' && v.url
          ? PERCORSI_PAGINE[v.url]
          : undefined
    if (!nuovo) return v
    cambiato = true
    return { ...v, url: nuovo.url, etichetta: nuovo.etichetta ?? v.etichetta }
  })
  return { voci: nuove, cambiato }
}

const ELENCHI = [
  'footerLink',
  'footerLegale',
  'inEvidenza',
  'serviziSinistra',
  'serviziDestra',
] as const

/** Aggiorna il menu già salvato nel database con gli indirizzi veri delle pagine. */
export async function aggiornaLinkPagine(payload: Payload) {
  const n = await payload.findGlobal({ slug: 'navigazione', depth: 0, overrideAccess: true })
  let cambiato = false
  const colonne = (n.colonne ?? []).map((c) => ({
    ...c,
    gruppi: (c.gruppi ?? []).map((g) => {
      const r = sistema(g.voci)
      cambiato ||= r.cambiato
      return { ...g, voci: r.voci }
    }),
  }))
  const data: Record<string, unknown> = { colonne }
  for (const k of ELENCHI) {
    const r = sistema(n[k] as Voce[] | null | undefined)
    cambiato ||= r.cambiato
    data[k] = r.voci
  }
  if (!cambiato) return
  await payload.updateGlobal({ slug: 'navigazione', data, overrideAccess: true })
  payload.logger.info('Menu: link alle pagine istituzionali aggiornati.')
}
