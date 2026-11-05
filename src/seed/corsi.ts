/**
 * Corsi e docenti per l'anteprima online: i 267 corsi pubblicati sul sito attuale (export del 21/10)
 * e i loro docenti, solo con dati già pubblici (nome, email istituzionale, ruolo, scuole).
 * Uso autorizzato da Fede il 23/10/2026. Parte con SEED_DEMO=true se non ci sono corsi.
 */
import type { Payload } from 'payload'

import { annoAccademicoCorrente } from '@/access/corsi'
import type { Corso, Docente } from '@/payload-types'

import dati from './corsi-demo.json'
import { inFrase } from '@/utilities/maiuscole'

/** Chiavi delle scuole nei campi ACF del sito attuale → nome della scuola. */
const SCUOLE: Record<string, string> = {
  pittura: 'Pittura',
  scultura: 'Scultura',
  decorazione: 'Decorazione',
  grafica: "Grafica d'Arte",
  scenografia: 'Scenografia',
  nta: "Nuove Tecnologie dell'Arte",
  didattica: "Didattica dell'Arte",
  comunicazione: 'Comunicazione e Valorizzazione del Patrimonio Artistico Contemporaneo',
  pai: "Progettazione Artistica per l'Impresa",
  cinema: 'Cinema, Fotografia e Audiovisivo',
}

/** Indirizzi del menu cambiati con l'arrivo delle pagine Corsi e Docenti. */
const LINK_SPOSTATI: Record<string, string> = {
  '/didattica/corsi': '/corsi',
  '/didattica/docenti': '/docenti',
}

export async function seedCorsi(payload: Payload) {
  const { totalDocs } = await payload.count({ collection: 'corsi' })
  if (totalDocs > 0) return
  payload.logger.info('Carico corsi e docenti demo…')

  const scuole = (await payload.find({ collection: 'scuole', limit: 50, depth: 0 })).docs
  const idScuole = (chiavi: string[]) =>
    chiavi.flatMap((k) => scuole.filter((s) => s.nome === SCUOLE[k]).map((s) => s.id))

  const docenti = new Map<number, number>()
  for (const d of dati.docenti) {
    const doc = await payload.create({
      collection: 'docenti',
      data: {
        nome: d.nome,
        cognome: d.cognome,
        email: d.email ?? undefined,
        ruolo: (d.ruolo ?? undefined) as Docente['ruolo'],
        scuole: idScuole(d.scuole),
      },
    })
    docenti.set(d.wp, doc.id)
  }

  const anno = annoAccademicoCorrente()
  for (const c of dati.corsi) {
    const docente = c.docente ? docenti.get(c.docente) : undefined
    if (!docente) continue
    await payload.create({
      collection: 'corsi',
      draft: false,
      data: {
        _status: 'published',
        titolo: inFrase(c.titolo),
        livelli: c.livelli as Corso['livelli'],
        annoAccademico: anno,
        docenti: [docente],
        scuole: idScuole(c.scuole),
        crediti: c.crediti ?? undefined,
        settore: c.settore ?? undefined,
        areaDisciplinare: c.area ?? undefined,
        esoneri: c.esoneri,
        revisioni: c.revisioni,
        descrizione: (c.descrizione ?? undefined) as never,
        bibliografia: (c.bibliografia ?? undefined) as never,
        altreInformazioni: (c.altre ?? undefined) as never,
      },
    })
  }

  // Il menu dell'anteprima era già salvato con i vecchi indirizzi.
  const nav = await payload.findGlobal({ slug: 'navigazione', depth: 0 })
  const sposta = <T extends { url?: string | null }>(v: T): T =>
    v.url && LINK_SPOSTATI[v.url] ? { ...v, url: LINK_SPOSTATI[v.url] } : v
  await payload.updateGlobal({
    slug: 'navigazione',
    data: {
      colonne: (nav.colonne ?? []).map((col) => ({
        ...col,
        gruppi: (col.gruppi ?? []).map((g) => ({ ...g, voci: (g.voci ?? []).map(sposta) })),
      })),
    },
  })
  payload.logger.info('Corsi e docenti demo caricati.')
}
