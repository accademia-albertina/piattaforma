import type { Payload } from 'payload'

import type { Navigazione } from '@/payload-types'

/** Vecchi link del menu (pagine del sito attuale) che ora portano a /calendari. */
const VECCHI = new Set(['/didattica/orario-lezioni', '/didattica/calendari'])
const NUOVO = { etichetta: 'Orari e calendari', tipo: 'percorso' as const, url: '/calendari' }

type Voce = NonNullable<Navigazione['footerLink']>[number]

/** Sostituisce i vecchi link con uno solo verso /calendari, senza doppioni nello stesso elenco. */
function sistema(voci: Voce[] | null | undefined): { voci: Voce[]; cambiato: boolean } {
  if (!voci) return { voci: [], cambiato: false }
  let cambiato = false
  let messo = false
  const nuove: Voce[] = []
  for (const v of voci) {
    if (v.tipo === 'percorso' && v.url && VECCHI.has(v.url)) {
      cambiato = true
      if (!messo) nuove.push({ ...v, ...NUOVO })
      messo = true
    } else nuove.push(v)
  }
  return { voci: nuove, cambiato }
}

/** Aggiorna il menu già salvato nel database (pannello) con il link alla pagina dei calendari. */
export async function aggiornaLinkCalendari(payload: Payload) {
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
  const footer = sistema(n.footerLink)
  const evidenza = sistema(n.inEvidenza)
  cambiato ||= footer.cambiato || evidenza.cambiato
  if (!cambiato) return
  await payload.updateGlobal({
    slug: 'navigazione',
    data: { colonne, footerLink: footer.voci, inEvidenza: evidenza.voci },
    overrideAccess: true,
  })
  payload.logger.info('Menu: link a Orari e calendari aggiornati.')
}
