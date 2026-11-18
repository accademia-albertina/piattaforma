/**
 * Link al sito WordPress rimasti nelle pagine (es. profili docenti /docente/a.giomi/): diventano
 * indirizzi del nuovo sito. Corregge anche le pagine modificate nel pannello, senza segnarle
 * come modificate e senza voci nel registro. Si può rilanciare: se non c'è nulla da fare, esce.
 */
import type { Payload } from 'payload'

import { mappaPercorsi, nuovoPercorso } from '@/lib/wp-import/contenuti/pagine-html'
import { SENZA_REGISTRO } from '@/lib/registro/costanti'
import { slugDocentiWp } from '@/seed/docenti-wp'

const WP = /^https?:\/\/(?:www\.)?albertina-academy\.it\/(?!wp-content\/)([^?#]*)$/

type Nodo = { [k: string]: unknown }

/** Indirizzo del nuovo sito per un link a WordPress, o null se non c'è un equivalente. */
export function indirizzoNuovo(url: string, mappa = mappaPercorsi([], slugDocentiWp())) {
  const m = WP.exec(url.trim())
  if (!m) return null
  const p = nuovoPercorso(m[1], mappa)
  return p ? `/${p}` : null
}

/** Riscrive i link nei blocchi (testi Lexical e blocchi Link). Restituisce quanti ne ha cambiati. */
export function correggiLink(valore: unknown, mappa = mappaPercorsi([], slugDocentiWp())) {
  let cambiati = 0
  const visita = (n: unknown) => {
    if (Array.isArray(n)) return n.forEach(visita)
    if (!n || typeof n !== 'object') return
    const o = n as Nodo
    // Nodo link di Lexical
    const campi = o.fields as Nodo | undefined
    if (o.type === 'link' && typeof campi?.url === 'string') {
      const nuovo = indirizzoNuovo(campi.url, mappa)
      if (nuovo) {
        campi.url = nuovo
        cambiati++
      }
    }
    // Voce di un blocco Link
    if (o.tipo === 'esterno' && typeof o.url === 'string') {
      const nuovo = indirizzoNuovo(o.url, mappa)
      if (nuovo) {
        o.url = nuovo
        o.tipo = 'percorso'
        cambiati++
      }
    }
    Object.values(o).forEach(visita)
  }
  visita(valore)
  return cambiati
}

export async function correggiLinkWpPagine(payload: Payload) {
  const { docs } = await payload.find({
    collection: 'pagine',
    pagination: false,
    depth: 0,
    draft: true,
    overrideAccess: true,
    select: { blocchi: true, _status: true },
  })
  const mappa = mappaPercorsi([], slugDocentiWp())
  for (const doc of docs) {
    const blocchi = structuredClone(doc.blocchi ?? [])
    const n = correggiLink(blocchi, mappa)
    if (!n) continue
    await payload.update({
      collection: 'pagine',
      id: doc.id,
      data: { blocchi },
      depth: 0,
      overrideAccess: true,
      draft: doc._status === 'draft',
      context: { importazione: true, [SENZA_REGISTRO]: true },
    })
    payload.logger.info(`Pagina ${doc.id}: ${n} link a WordPress corretti.`)
  }
}
