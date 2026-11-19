import type { Pagina } from '@/payload-types'

import { menuSito } from './menu'
import type { GruppoMenu, VoceMenu } from './navigazione'
import { sottopagine } from './pagine'

/**
 * Voci di una sezione del sito (Accademia, Didattica, Studente…) per il menu laterale e per
 * l’indice delle pagine genitore. Partono dal gruppo del menu principale, così menu, menu
 * laterale e indice coincidono (Fede 2026-11-18: prima mancavano Corsi, Docenti, Orari…);
 * in coda le sottopagine pubblicate che il menu non ha ancora.
 */
export type VoceSezione = VoceMenu & { sommario?: string | null }

/** Descrizioni delle pagine che non sono in Pagine (hanno un indirizzo proprio). */
const SOMMARI: Record<string, string> = {
  '/scuole': 'Le dieci scuole: Laurea e Laurea Magistrale, piani di studio e docenti.',
  '/corsi': 'Programmi dei corsi: docenti, crediti, orari e bibliografia.',
  '/docenti': 'Docenti dell’Accademia: corsi, ricevimento e contatti.',
  '/calendari': 'Orario delle lezioni, calendari degli esami e delle sessioni di tesi.',
  '/dottorati/albertina/dottorandi': 'I dottorandi e i loro progetti di ricerca.',
}

const pulisci = (href: string) => href.split(/[?#]/)[0].replace(/\/+$/, '') || '/'

function gruppoDellaSezione(gruppi: GruppoMenu[], radice: Pick<Pagina, 'titolo' | 'percorso'>) {
  const base = `/${radice.percorso}`
  return (
    gruppi.find((g) => g.voci.some((v) => !v.esterno && pulisci(v.href).startsWith(`${base}/`))) ??
    gruppi.find((g) => g.voci.some((v) => !v.esterno && pulisci(v.href) === base)) ??
    gruppi.find((g) => g.titolo.trim().toLowerCase() === radice.titolo.trim().toLowerCase()) ??
    null
  )
}

/** Voci della sezione che ha `radice` come pagina genitore (senza gruppo nel menu: le sottopagine). */
export async function vociSezione(
  radice: Pick<Pagina, 'id' | 'titolo' | 'percorso'>,
): Promise<VoceSezione[]> {
  const [menu, figlie] = await Promise.all([menuSito(), sottopagine(radice)])
  const gruppo = gruppoDellaSezione(menu.colonne.flat(), radice)
  const perHref = new Map(figlie.map((f) => [`/${f.percorso}`, f]))
  const voci: VoceSezione[] = (gruppo?.voci ?? []).map((v) => {
    const pagina = v.esterno ? undefined : perHref.get(pulisci(v.href))
    return { ...v, sommario: pagina?.sommario ?? SOMMARI[pulisci(v.href)] ?? null }
  })
  const presenti = new Set(voci.filter((v) => !v.esterno).map((v) => pulisci(v.href)))
  for (const f of figlie) {
    const href = `/${f.percorso}`
    if (!presenti.has(href)) voci.push({ label: f.titolo, href, sommario: f.sommario ?? null })
  }
  return voci
}
