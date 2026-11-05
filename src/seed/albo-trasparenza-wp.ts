/**
 * Albo online e Amministrazione trasparente del sito attuale, per l'anteprima.
 * I file si generano con scripts/wp/estrai-albo.py e scripts/wp/estrai-trasparenza.py;
 * i documenti restano link ai file su albertina-academy.it. Si importano solo le voci che
 * mancano, e solo finché la collezione ne ha meno di quelle del file: se un'importazione si
 * interrompe (es. durante la build) riprende al riavvio, senza doppioni.
 */
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import type { Payload } from 'payload'

import { SEZIONI_TRASPARENZA, type SezioneAlbo, type SezioneTrasparenza } from '@/lib/albo'

const dirname = path.dirname(fileURLToPath(import.meta.url))
const leggi = <T>(nome: string): T => JSON.parse(readFileSync(path.join(dirname, nome), 'utf8'))

type AttoWp = {
  sezione: SezioneAlbo
  categoria: string
  anno: string | null
  titolo: string
  pubblicatoIl: string | null
  scadenza: string | null
  documenti: { nome: string; url: string }[]
}

type VoceWp = {
  titolo: string
  slug: string
  sezione: string
  aggiornatoIl: string
  documenti: { nome: string; url: string; nota: string }[]
}

const pulito = (s: string) => s.replace(/\r\n?/g, '\n').trim()

const chiaveAtto = (a: { sezione: string; titolo: string; pubblicatoIl?: string | null }) =>
  `${a.sezione}|${a.titolo.slice(0, 300).trim().toLowerCase()}|${(a.pubblicatoIl ?? '').slice(0, 10)}`

export async function importaAlboWp(payload: Payload) {
  const atti = leggi<AttoWp[]>('albo-wp.json')
  const esistenti = await payload.find({
    collection: 'albo',
    pagination: false,
    depth: 0,
    draft: true,
    select: { sezione: true, titolo: true, pubblicatoIl: true },
    overrideAccess: true,
  })
  if (esistenti.docs.length >= atti.length) return
  const presenti = new Set(esistenti.docs.map(chiaveAtto))
  const mancanti = atti.filter(
    (a) => !presenti.has(chiaveAtto({ ...a, pubblicatoIl: a.pubblicatoIl ?? '2024-10-01' })),
  )
  if (mancanti.length === 0) return
  payload.logger.info(`Importo ${mancanti.length} atti dell’Albo dal sito attuale…`)
  for (const a of mancanti) {
    await payload.create({
      collection: 'albo',
      data: {
        titolo: a.titolo.slice(0, 300),
        sezione: a.sezione,
        categoria: a.categoria,
        annoAccademico: a.anno,
        pubblicatoIl: a.pubblicatoIl ?? '2024-10-01',
        scadenza: a.scadenza,
        documenti: a.documenti.map((d) => ({ nome: d.nome.slice(0, 300), url: d.url })),
        _status: 'published',
      },
      overrideAccess: true,
    })
  }
  payload.logger.info('Albo online importato.')
}

export async function importaTrasparenzaWp(payload: Payload) {
  const voci = leggi<VoceWp[]>('trasparenza-wp.json')
  const esistenti = await payload.find({
    collection: 'trasparenza',
    pagination: false,
    depth: 0,
    draft: true,
    select: { slug: true },
    overrideAccess: true,
  })
  if (esistenti.docs.length >= voci.length) return
  const slug = new Set(esistenti.docs.map((d) => d.slug))
  const mancanti = voci.filter((v) => !slug.has(v.slug))
  if (mancanti.length === 0) return
  payload.logger.info(`Importo ${mancanti.length} sottosezioni della trasparenza dal sito attuale…`)
  for (const v of mancanti) {
    if (!(SEZIONI_TRASPARENZA as readonly string[]).includes(v.sezione)) continue
    // Le righe senza link sono testo: vanno nel campo Testo.
    const testo = v.documenti
      .filter((d) => !d.url)
      .map((d) => [d.nome, pulito(d.nota)].filter(Boolean).join('\n'))
      .filter(Boolean)
      .join('\n\n')
    await payload.create({
      collection: 'trasparenza',
      data: {
        titolo: v.titolo,
        slug: v.slug,
        sezione: v.sezione as SezioneTrasparenza,
        testo: testo || null,
        documenti: v.documenti
          .filter((d) => d.url)
          .map((d) => ({ nome: d.nome || 'Documento', url: d.url, nota: pulito(d.nota) || null })),
        aggiornatoIl: new Date(v.aggiornatoIl.replace(' ', 'T') + '+01:00').toISOString(),
        _status: 'published',
      },
      context: { importazione: true },
      overrideAccess: true,
    })
  }
  payload.logger.info('Amministrazione trasparente importata.')
}
