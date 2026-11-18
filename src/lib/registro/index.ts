/**
 * Registro attività del pannello (leggero): per ogni salvataggio o eliminazione fatta da
 * chi lavora nel pannello scrive una voce con chi, cosa, quando e i NOMI dei campi cambiati.
 * Niente valori né diff completi: bastano per capire chi ha toccato cosa senza appesantire
 * il database.
 *
 * Le operazioni che toccano centinaia di elementi in background (sincronizzazioni da
 * WordPress, spostamento su Drive, pulizia annuale delle iscrizioni) non scrivono una voce
 * per elemento: chi le avvia le registra con `registraOperazione`, all'avvio e alla fine con
 * l'esito. Non si registrano gli studenti (iscrizioni dal sito) né gli import automatici
 * dei contenuti demo all'avvio dell'anteprima.
 */
import type {
  CollectionAfterChangeHook,
  CollectionAfterDeleteHook,
  FlattenedField,
  GlobalAfterChangeHook,
  Payload,
  PayloadRequest,
  Plugin,
} from 'payload'

import { canAccessBackend } from '@/access/roles'

import {
  type AzioneRegistro,
  ETICHETTE_AZIONE,
  GIORNI_CONSERVAZIONE,
  NOME_SISTEMA,
  SENZA_REGISTRO,
  SLUG_REGISTRO,
} from './costanti'

type Doc = Record<string, unknown>
export type Utente = {
  id: number | string
  email?: string | null
  nome?: string | null
  cognome?: string | null
}

/** Campi tecnici che cambiano da soli e non dicono nulla su chi ha lavorato. */
const IGNORATI = new Set([
  'id',
  'createdAt',
  'updatedAt',
  '_status',
  'sessions',
  'loginAttempts',
  'lockUntil',
  'resetPasswordToken',
  'resetPasswordExpiration',
  'salt',
  'hash',
])

const testo = (v: unknown): string | null =>
  typeof v === 'string' && v.trim() ? v.trim() : typeof v === 'number' ? String(v) : null

const etichetta = (label: unknown, riserva: string): string =>
  typeof label === 'string' && label ? label : riserva

/** Valore confrontabile: le relazioni popolate valgono quanto il loro id. */
const normalizza = (v: unknown): unknown => {
  if (Array.isArray(v)) return v.map(normalizza)
  if (v && typeof v === 'object' && 'id' in v && Object.keys(v).length > 2) {
    return (v as { id: unknown }).id
  }
  return v
}

/** Nomi (etichette) dei campi di primo livello che differiscono tra le due versioni. */
export function campiCambiati(
  campi: FlattenedField[],
  prima: Doc | undefined,
  dopo: Doc,
): string[] {
  if (!prima) return []
  const nomi: string[] = []
  for (const campo of campi) {
    if (IGNORATI.has(campo.name) || campo.hidden) continue
    const a = JSON.stringify(normalizza(prima[campo.name]) ?? null)
    const b = JSON.stringify(normalizza(dopo[campo.name]) ?? null)
    if (a !== b) nomi.push(etichetta(campo.label, campo.name))
  }
  return nomi
}

/**
 * Da bozza a pubblicato e viceversa; altrimenti creato o modificato.
 * `salvaBozza`: "Salva bozza" su un elemento pubblicato non lo ritira (la versione online
 * resta), mentre "Ritira" del pannello manda _status draft senza ?draft=true.
 */
export function azioneDaStato(
  operation: 'create' | 'update',
  prima: Doc | undefined,
  dopo: Doc,
  salvaBozza = false,
): AzioneRegistro {
  const stato = dopo._status
  const statoPrima = prima?._status
  if (operation === 'create') return stato === 'published' ? 'pubblicato' : 'creato'
  if (stato === 'published' && statoPrima !== 'published') return 'pubblicato'
  if (stato === 'draft' && statoPrima === 'published' && !salvaBozza) return 'ritirato'
  return 'modificato'
}

const nomeUtente = (u: Utente) =>
  [u.nome, u.cognome].filter(Boolean).join(' ') || u.email || `Account ${u.id}`

/** Si registra solo chi lavora nel pannello, e mai il registro stesso. */
function utenteDaRegistrare(req: PayloadRequest): Utente | null {
  if (req.context?.[SENZA_REGISTRO]) return null
  const user = req.user as (Utente & { collection?: string }) | null | undefined
  if (!user || (user.collection && user.collection !== 'users')) return null
  return canAccessBackend(user as never) ? user : null
}

/** "1 file nuovo", "3 file nuovi": numeri con il plurale giusto, per i dettagli. */
export const conta = (n: number, singolare: string, plurale: string) =>
  `${n} ${n === 1 ? singolare : plurale}`

let ultimaPulizia = 0

/** Al massimo una volta al giorno per processo toglie le voci più vecchie di un anno. */
function pulisciVecchie(payload: Payload) {
  const ora = Date.now()
  if (ora - ultimaPulizia < 24 * 60 * 60 * 1000) return
  ultimaPulizia = ora
  const limite = new Date(ora - GIORNI_CONSERVAZIONE * 24 * 60 * 60 * 1000).toISOString()
  void payload
    .delete({
      collection: SLUG_REGISTRO,
      where: { createdAt: { less_than: limite } },
      overrideAccess: true,
      depth: 0,
    })
    .catch((e) => payload.logger.error(`Pulizia registro attività: ${(e as Error).message}`))
}

type Voce = {
  azione: AzioneRegistro
  collezione: string
  sezione: string
  documentoId?: string
  titolo: string
  campi?: string[]
  dettagli?: string
}

async function scrivi(payload: Payload, utente: Utente | null, voce: Voce, req?: PayloadRequest) {
  const chi = utente ? nomeUtente(utente) : NOME_SISTEMA
  const campi = voce.campi?.length ? voce.campi.join(', ') : '—'
  try {
    await payload.create({
      collection: SLUG_REGISTRO,
      data: {
        azione: voce.azione,
        utente: utente ? (typeof utente.id === 'number' ? utente.id : Number(utente.id)) : null,
        utenteNome: chi,
        utenteEmail: utente?.email ?? undefined,
        collezione: voce.collezione,
        sezione: voce.sezione,
        documentoId: voce.documentoId,
        titolo: voce.titolo.slice(0, 300),
        campi: campi.slice(0, 500),
        dettagli: voce.dettagli?.slice(0, 2000),
        riepilogo: `${chi} · ${ETICHETTE_AZIONE[voce.azione].toLowerCase()} · ${voce.titolo}`.slice(
          0,
          400,
        ),
      },
      overrideAccess: true,
      depth: 0,
      // Nella stessa transazione del salvataggio: se questo fallisce, non resta una voce falsa
      req,
    })
  } catch (e) {
    payload.logger.error(`Registro attività non scritto: ${(e as Error).message}`)
  }
  pulisciVecchie(payload)
}

/**
 * Registra un'operazione che non è il salvataggio di un singolo elemento: avvio e fine di
 * una sincronizzazione, collegamento a Drive, pulizia delle iscrizioni. Senza utente la voce
 * è del "Sistema". Non lancia mai errori: il registro non deve bloccare l'operazione.
 */
export async function registraOperazione(
  payload: Payload,
  utente: Utente | null | undefined,
  voce: Omit<Voce, 'campi'>,
) {
  await scrivi(payload, utente ?? null, voce)
}

const titoloDoc = (doc: Doc, useAsTitle: string | undefined, id: unknown) =>
  testo(useAsTitle ? doc[useAsTitle] : undefined) ??
  testo(doc.titolo) ??
  testo(doc.nome) ??
  testo(doc.filename) ??
  testo(doc.email) ??
  `#${String(id)}`

const dopoSalvataggio: CollectionAfterChangeHook = async ({
  collection,
  doc,
  previousDoc,
  operation,
  req,
}) => {
  const utente = utenteDaRegistrare(req)
  if (!utente) return doc
  const campi =
    operation === 'update' ? campiCambiati(collection.flattenedFields, previousDoc, doc) : []
  const bozza = req.query?.draft
  const azione = azioneDaStato(operation, previousDoc, doc, bozza === 'true' || bozza === true)
  // Un salvataggio senza modifiche non è un'attività
  if (azione === 'modificato' && campi.length === 0) return doc
  await scrivi(
    req.payload,
    utente,
    {
      azione,
      collezione: collection.slug,
      sezione: etichetta(collection.labels?.plural, collection.slug),
      documentoId: String(doc.id),
      titolo: titoloDoc(doc, collection.admin?.useAsTitle, doc.id),
      campi,
    },
    req,
  )
  return doc
}

const dopoEliminazione: CollectionAfterDeleteHook = async ({ collection, doc, id, req }) => {
  const utente = utenteDaRegistrare(req)
  if (!utente) return doc
  await scrivi(
    req.payload,
    utente,
    {
      azione: 'eliminato',
      collezione: collection.slug,
      sezione: etichetta(collection.labels?.plural, collection.slug),
      documentoId: String(id),
      titolo: titoloDoc((doc ?? {}) as Doc, collection.admin?.useAsTitle, id),
    },
    req,
  )
  return doc
}

const dopoSalvataggioGlobale: GlobalAfterChangeHook = async ({ global, doc, previousDoc, req }) => {
  const utente = utenteDaRegistrare(req)
  if (!utente) return doc
  const campi = campiCambiati(global.flattenedFields, previousDoc, doc)
  if (campi.length === 0) return doc
  const nome = etichetta(global.label, global.slug)
  await scrivi(
    req.payload,
    utente,
    { azione: 'modificato', collezione: global.slug, sezione: nome, titolo: nome, campi },
    req,
  )
  return doc
}

/** Registri tecnici scritti dal server: registrarli qui sarebbe solo rumore. */
const ESCLUSE = new Set<string>([SLUG_REGISTRO, 'email-inviate'])

/** Aggiunge gli hook del registro a tutte le collezioni e ai globali (tranne i registri). */
export const registroAttivita = (): Plugin => (config) => ({
  ...config,
  collections: (config.collections ?? []).map((c) =>
    ESCLUSE.has(c.slug)
      ? c
      : {
          ...c,
          hooks: {
            ...c.hooks,
            afterChange: [...(c.hooks?.afterChange ?? []), dopoSalvataggio],
            afterDelete: [...(c.hooks?.afterDelete ?? []), dopoEliminazione],
          },
        },
  ),
  globals: (config.globals ?? []).map((g) => ({
    ...g,
    hooks: { ...g.hooks, afterChange: [...(g.hooks?.afterChange ?? []), dopoSalvataggioGlobale] },
  })),
})
