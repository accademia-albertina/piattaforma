/**
 * Profili pubblici dei docenti sul sito attuale (export WordPress del 4/11/2026, in sola lettura,
 * con l'ok di Fede): biografia, ricevimento, ruolo e scuole. Il file docenti-wp.json.gz si genera
 * con scripts/wp/converti-docenti.ts. Abbina i docenti per email istituzionale (o nome e cognome)
 * e riempie solo i campi vuoti, così non sovrascrive mai quello che è stato scritto nel pannello;
 * crea i docenti che mancano. Si può rilanciare a ogni avvio.
 */
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { gunzipSync } from 'node:zlib'
import type { Payload } from 'payload'

import type { Docente } from '@/payload-types'

import { SCUOLE } from './scuole-wp'

const dirname = path.dirname(fileURLToPath(import.meta.url))

type DocenteWp = {
  wpId: number
  nome: string
  cognome: string
  email: string | null
  ruolo: Docente['ruolo']
  scuole: string[]
  ricevimento: string | null
  biografia: Docente['biografia']
}

const chiaveNome = (nome: string, cognome: string) =>
  `${nome} ${cognome}`
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()

export async function importaDocentiWp(payload: Payload) {
  const profili: DocenteWp[] = JSON.parse(
    gunzipSync(readFileSync(path.join(dirname, 'docenti-wp.json.gz'))).toString('utf8'),
  )
  const esistenti = (await payload.find({ collection: 'docenti', pagination: false, depth: 0 }))
    .docs
  const perEmail = new Map(esistenti.filter((d) => d.email).map((d) => [d.email!.toLowerCase(), d]))
  const perNome = new Map(esistenti.map((d) => [chiaveNome(d.nome, d.cognome), d]))

  const scuole = await payload.find({ collection: 'scuole', pagination: false, depth: 0 })
  const idScuola = new Map(scuole.docs.map((s) => [s.nome, s.id]))
  const idScuole = (chiavi: string[]) =>
    chiavi.map((k) => idScuola.get(SCUOLE[k])).filter((id): id is number => typeof id === 'number')

  let aggiornati = 0
  let creati = 0
  // Le caselle di ufficio (es. vicedirezione@) non sono docenti: senza cognome si saltano
  for (const p of profili.filter((x) => x.cognome)) {
    const doc = (p.email && perEmail.get(p.email)) || perNome.get(chiaveNome(p.nome, p.cognome))
    try {
      if (!doc) {
        await payload.create({
          collection: 'docenti',
          context: { importazione: true },
          data: {
            nome: p.nome,
            cognome: p.cognome,
            email: p.email ?? undefined,
            ruolo: p.ruolo ?? undefined,
            scuole: idScuole(p.scuole),
            ricevimento: p.ricevimento ?? undefined,
            biografia: p.biografia ?? undefined,
          },
        })
        creati++
        continue
      }
      const data: Partial<Docente> = {}
      if (!doc.biografia && p.biografia) data.biografia = p.biografia
      if (!doc.ricevimento && p.ricevimento) data.ricevimento = p.ricevimento
      if (!doc.ruolo && p.ruolo) data.ruolo = p.ruolo
      if (!doc.email && p.email) data.email = p.email
      if (!doc.scuole?.length && p.scuole.length) data.scuole = idScuole(p.scuole)
      if (Object.keys(data).length === 0) continue
      await payload.update({
        collection: 'docenti',
        id: doc.id,
        context: { importazione: true },
        data,
      })
      aggiornati++
    } catch (e) {
      payload.logger.warn(`Docente WP ${p.wpId} non importato: ${(e as Error).message}`)
    }
  }
  if (aggiornati || creati) {
    payload.logger.info(`Profili docenti: ${aggiornati} aggiornati, ${creati} creati.`)
  }
}
