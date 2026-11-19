import { createHash, randomBytes, randomInt, timingSafeEqual } from 'node:crypto'

import type { Payload, PayloadRequest } from 'payload'

import { DOCUMENTI_PREDEFINITI } from '@/globals/SportelloSegreteria'
import type { PrenotazioneSegreteria, SportelloSegreteria } from '@/payload-types'

import {
  giornoRoma,
  giorniDiApertura,
  istanteRoma,
  oraRoma,
  turniDelGiorno,
  type ImpostazioniOrari,
} from './sportello-orari'

export type Impostazioni = ImpostazioniOrari & {
  attivo: boolean
  avviso?: string | null
  documenti: { id: string; nome: string; descrizione?: string | null; attivo: boolean }[]
}

/** Valori iniziali, uguali ad Amelia, finché la segreteria non salva le impostazioni. */
const PREDEFINITE: Impostazioni = {
  attivo: true,
  durataTurno: 5,
  personePerTurno: 1,
  giorniPrenotabili: 60,
  giorniPreavviso: 2,
  orari: [
    { giorno: '1', dalle: '10:00', alle: '12:00' },
    { giorno: '5', dalle: '10:00', alle: '12:00' },
  ],
  chiusure: [],
  aperture: [],
  documenti: DOCUMENTI_PREDEFINITI.map((nome, i) => ({ id: `doc-${i + 1}`, nome, attivo: true })),
}

export async function leggiImpostazioni(
  payload: Payload,
  req?: PayloadRequest,
): Promise<Impostazioni> {
  const g = (await payload.findGlobal({
    slug: 'sportello-segreteria',
    depth: 0,
    overrideAccess: true,
    req,
  })) as SportelloSegreteria
  if (!g?.updatedAt) {
    return {
      ...PREDEFINITE,
      chiusure: (g?.chiusure ?? []) as Impostazioni['chiusure'],
      avviso: g?.avviso,
    }
  }
  return {
    attivo: g.attivo !== false,
    avviso: g.avviso,
    durataTurno: g.durataTurno,
    personePerTurno: g.personePerTurno,
    giorniPrenotabili: g.giorniPrenotabili,
    giorniPreavviso: g.giorniPreavviso ?? 0,
    orari: g.orari ?? [],
    chiusure: g.chiusure ?? [],
    aperture: g.aperture ?? [],
    documenti: (g.documenti ?? []).map((d, i) => ({
      id: d.id ?? `doc-${i + 1}`,
      nome: d.nome,
      descrizione: d.descrizione,
      attivo: d.attivo !== false,
    })),
  }
}

export const STATI = ['prenotata', 'ritirata', 'assente', 'annullata'] as const
export type StatoPrenotazione = (typeof STATI)[number]
export const STATO_LABELS: Record<StatoPrenotazione, string> = {
  prenotata: 'Prenotata',
  ritirata: 'Ritirato',
  assente: 'Non presentato',
  annullata: 'Annullata',
}

export type Turno = { ora: string; inizio: string; liberi: number }
export type GiornoDisponibile = { data: string; turni: Turno[]; liberi: number }

/** Prenotazioni che occupano un turno (non annullate) tra due istanti. */
async function occupati(payload: Payload, dal: Date, al: Date, req?: PayloadRequest) {
  const { docs } = await payload.find({
    collection: 'prenotazioni-segreteria',
    where: {
      and: [
        { inizio: { greater_than_equal: dal.toISOString() } },
        { inizio: { less_than: al.toISOString() } },
        { stato: { not_equals: 'annullata' } },
      ],
    },
    select: { inizio: true },
    pagination: false,
    depth: 0,
    overrideAccess: true,
    req,
  })
  const conta = new Map<number, number>()
  for (const d of docs) {
    const t = new Date(d.inizio).getTime()
    conta.set(t, (conta.get(t) ?? 0) + 1)
  }
  return conta
}

/** Giorni e turni prenotabili da adesso, con i posti liberi. */
export async function disponibilita(
  payload: Payload,
  imp: Impostazioni,
  adesso = new Date(),
  req?: PayloadRequest,
): Promise<GiornoDisponibile[]> {
  const giorni = giorniDiApertura(giornoRoma(adesso), imp)
  if (!giorni.length) return []
  const conta = await occupati(
    payload,
    istanteRoma(giorni[0], '00:00'),
    istanteRoma(giorni[giorni.length - 1], '23:59'),
    req,
  )
  const capienza = Math.max(1, imp.personePerTurno || 1)
  return giorni
    .map((data) => {
      const turni = turniDelGiorno(data, imp)
        .map((ora) => {
          const inizio = istanteRoma(data, ora)
          return {
            ora,
            inizio: inizio.toISOString(),
            liberi: Math.max(0, capienza - (conta.get(inizio.getTime()) ?? 0)),
            passato: inizio.getTime() <= adesso.getTime(),
          }
        })
        .filter((t) => !t.passato)
        .map(({ passato: _, ...t }) => t)
      return { data, turni, liberi: turni.reduce((s, t) => s + t.liberi, 0) }
    })
    .filter((g) => g.turni.length)
}

/** Il turno esiste nell'orario ed è ancora futuro? */
export function turnoValido(imp: Impostazioni, inizio: Date, adesso = new Date()) {
  if (Number.isNaN(inizio.getTime()) || inizio.getTime() <= adesso.getTime()) return false
  const data = giornoRoma(inizio)
  if (!giorniDiApertura(giornoRoma(adesso), imp).includes(data)) return false
  return turniDelGiorno(data, imp).includes(oraRoma(inizio))
}

/**
 * Posto libero nel turno: "istante|n". Il campo è unico nel database, così due persone che
 * prenotano lo stesso turno nello stesso istante non passano entrambe.
 */
export async function postoLibero(
  payload: Payload,
  inizio: Date,
  capienza: number,
  req?: PayloadRequest,
  escludi?: number,
): Promise<string | null> {
  const { docs } = await payload.find({
    collection: 'prenotazioni-segreteria',
    where: {
      inizio: { equals: inizio.toISOString() },
      stato: { not_equals: 'annullata' },
      ...(escludi ? { id: { not_equals: escludi } } : {}),
    },
    select: { posto: true },
    pagination: false,
    depth: 0,
    overrideAccess: true,
    showHiddenFields: true,
    req,
  })
  const presi = new Set(docs.map((d) => (d as { posto?: string | null }).posto))
  for (let n = 1; n <= Math.max(1, capienza); n++) {
    const posto = `${inizio.toISOString()}|${n}`
    if (!presi.has(posto)) return posto
  }
  return null
}

/* ---------- Codici per la disdetta e per la verifica dell'email ---------- */

const segreto = () => process.env.PAYLOAD_SECRET || 'sviluppo'
export const impronta = (valore: string) =>
  createHash('sha256').update(`${segreto()}:${valore}`).digest('hex')

const uguali = (a: string, b: string) =>
  a.length === b.length && timingSafeEqual(Buffer.from(a), Buffer.from(b))

/** Codice per disdire dal link dell'email: nel database ne resta solo l'impronta. */
export function nuovoCodiceDisdetta() {
  const codice = randomBytes(18).toString('base64url')
  return { codice, impronta: impronta(codice) }
}

export const codiceDisdettaValido = (codice: string, salvata?: string | null) =>
  Boolean(salvata && codice && uguali(impronta(codice), salvata))

export const VALIDITA_CODICE_MINUTI = 15
export const TENTATIVI_CODICE = 5
export const CODICI_PER_ORA = 3

export const normalizzaEmail = (email: string) => email.trim().toLowerCase()
export const EMAIL_VALIDA = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

export const nuovoCodiceEmail = () => String(randomInt(0, 1_000_000)).padStart(6, '0')
export const improntaCodiceEmail = (email: string, codice: string) =>
  impronta(`email:${normalizzaEmail(email)}:${codice}`)

/**
 * Verifica il codice ricevuto via email (esterni). Ogni codice vale 15 minuti e 5 tentativi;
 * usato una volta, non vale più.
 */
export async function verificaCodiceEmail(
  payload: Payload,
  email: string,
  codice: string,
  req?: PayloadRequest,
): Promise<'ok' | 'errato' | 'scaduto'> {
  const { docs } = await payload.find({
    collection: 'codici-email',
    where: {
      email: { equals: normalizzaEmail(email) },
      usato: { not_equals: true },
      scadenza: { greater_than: new Date().toISOString() },
    },
    sort: '-createdAt',
    limit: 1,
    depth: 0,
    overrideAccess: true,
    req,
  })
  const doc = docs[0]
  if (!doc || (doc.tentativi ?? 0) >= TENTATIVI_CODICE) return 'scaduto'
  const ok = uguali(improntaCodiceEmail(email, codice.trim()), doc.impronta)
  await payload.update({
    collection: 'codici-email',
    id: doc.id,
    data: ok ? { usato: true } : { tentativi: (doc.tentativi ?? 0) + 1 },
    overrideAccess: true,
    req,
  })
  return ok ? 'ok' : 'errato'
}

export const sito = () =>
  (process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000').replace(/\/$/, '')

export const linkDisdetta = (p: Pick<PrenotazioneSegreteria, 'id'>, codice: string) =>
  `${sito()}/prenotazioni-segreteria/disdici?p=${p.id}&token=${encodeURIComponent(codice)}`

/** Istante attuale in millisecondi (funzione a parte: i componenti server non chiamano Date.now). */
export const adesso = () => Date.now()
