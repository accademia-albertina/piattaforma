import type { CollectionConfig, PayloadRequest } from 'payload'

import { nascostaA } from '@/access/pannello'
import { hasRole } from '@/access/roles'
import { gestisceSportello, leggiPrenotazioni, nessuno, soloSportello } from '@/access/sportello'
import { datiStudente } from '@/access/iscrizioni'
import { avvisaAnnullamento, avvisaConferma, messaggioCodice } from '@/lib/email-sportello'
import { spedisci } from '@/lib/email'
import { erroreUtente } from '@/lib/errori'
import {
  CODICI_PER_ORA,
  EMAIL_VALIDA,
  STATI,
  STATO_LABELS,
  VALIDITA_CODICE_MINUTI,
  codiceDisdettaValido,
  disponibilita,
  improntaCodiceEmail,
  leggiImpostazioni,
  normalizzaEmail,
  nuovoCodiceDisdetta,
  nuovoCodiceEmail,
  postoLibero,
  turnoValido,
  verificaCodiceEmail,
} from '@/lib/sportello'
import type { PrenotazioneSegreteria, User } from '@/payload-types'

const rifiuta = (messaggio: string, status = 400): never => {
  throw erroreUtente(messaggio, status)
}

type Corpo = Record<string, unknown>
const leggiCorpo = async (req: PayloadRequest): Promise<Corpo> =>
  ((await req.json?.().catch(() => ({}))) ?? {}) as Corpo
const testo = (v: unknown, max = 200) => (typeof v === 'string' ? v.trim().slice(0, max) : '')

const json = (dati: unknown, status = 200) => Response.json(dati, { status })
const errore = (e: unknown) => {
  const err = e as { status?: number; message?: string }
  return json({ errors: [{ message: err.message ?? 'Operazione non riuscita.' }] }, err.status ?? 500)
}

const ISTITUZIONALE = /@albertina\.academy$/i

const TURNO_PRESO =
  'Qualcuno ha appena prenotato questo turno: scegline un altro.'

/** Le prenotazioni attive dello stesso documento per quella email (una sola alla volta). */
async function giaPrenotato(req: PayloadRequest, email: string, documento: string) {
  const { totalDocs } = await req.payload.count({
    collection: 'prenotazioni-segreteria',
    where: {
      email: { equals: normalizzaEmail(email) },
      documento: { equals: documento },
      stato: { equals: 'prenotata' },
      inizio: { greater_than: new Date().toISOString() },
    },
    overrideAccess: true,
    req,
  })
  return totalDocs > 0
}

/**
 * Annulla le prenotazioni future che cadono in una chiusura appena aggiunta dalla segreteria e
 * avvisa chi aveva prenotato (chiamata dal globale dello sportello).
 */
export async function annullaPerChiusure(req: PayloadRequest) {
  const imp = await leggiImpostazioni(req.payload, req)
  const { docs } = await req.payload.find({
    collection: 'prenotazioni-segreteria',
    where: {
      stato: { equals: 'prenotata' },
      inizio: { greater_than: new Date().toISOString() },
    },
    pagination: false,
    depth: 0,
    overrideAccess: true,
    req,
  })
  const { chiusuraDelTurno, giornoRoma, oraRoma } = await import('@/lib/sportello-orari')
  let annullate = 0
  for (const p of docs) {
    const d = new Date(p.inizio)
    const c = chiusuraDelTurno(giornoRoma(d), oraRoma(d), imp.durataTurno || 5, imp.chiusure ?? [])
    if (!c) continue
    await req.payload.update({
      collection: 'prenotazioni-segreteria',
      id: p.id,
      data: { stato: 'annullata', motivoAnnullamento: c.motivo || 'Chiusura dello sportello' },
      overrideAccess: true,
      req,
      context: { ...req.context, annullataDa: 'chiusura' },
    })
    annullate++
  }
  return annullate
}

/**
 * Appuntamenti allo sportello della segreteria didattica (ritiro documenti), al posto di Amelia.
 * Si prenota dal sito: gli studenti con l'account Google, gli esterni con un codice via email.
 * La segreteria vede l'elenco del giorno, segna ritirato / non presentato, annulla.
 */
export const PrenotazioniSegreteria: CollectionConfig = {
  slug: 'prenotazioni-segreteria',
  labels: { singular: 'Appuntamento', plural: 'Appuntamenti' },
  typescript: { interface: 'PrenotazioneSegreteria' },
  admin: {
    hidden: nascostaA('prenotazioni-segreteria'),
    group: 'Sportello della segreteria',
    useAsTitle: 'nominativo',
    description: 'Chi viene allo sportello e quando. Si prenota dal sito.',
    defaultColumns: ['inizio', 'nominativo', 'documento', 'stato'],
    listSearchableFields: ['nominativo', 'email', 'matricola'],
    components: {
      views: { list: { Component: '/components/admin/AgendaSportello' } },
    },
  },
  defaultSort: 'inizio',
  access: {
    read: leggiPrenotazioni,
    create: soloSportello,
    update: soloSportello,
    delete: ({ req }) => hasRole(req.user, 'admin'),
  },
  endpoints: [
    {
      path: '/disponibilita',
      method: 'get',
      handler: async (req) => {
        const imp = await leggiImpostazioni(req.payload, req)
        const giorni = imp.attivo ? await disponibilita(req.payload, imp, new Date(), req) : []
        return json({ attivo: imp.attivo, giorni })
      },
    },
    {
      // Codice di 6 cifre per chi prenota senza account istituzionale
      path: '/codice',
      method: 'post',
      handler: async (req) => {
        try {
          const email = normalizzaEmail(testo((await leggiCorpo(req)).email))
          if (!EMAIL_VALIDA.test(email)) rifiuta('Scrivi un indirizzo email valido.')
          if (ISTITUZIONALE.test(email))
            rifiuta('Con l’email @albertina.academy accedi con Google: non serve il codice.')
          const unOraFa = new Date(Date.now() - 60 * 60 * 1000).toISOString()
          const recenti = await req.payload.count({
            collection: 'codici-email',
            where: { email: { equals: email }, createdAt: { greater_than: unOraFa } },
            overrideAccess: true,
            req,
          })
          if (recenti.totalDocs >= CODICI_PER_ORA)
            rifiuta('Hai chiesto troppi codici: riprova tra un’ora.', 429)
          const tutti = await req.payload.count({
            collection: 'codici-email',
            where: { createdAt: { greater_than: unOraFa } },
            overrideAccess: true,
            req,
          })
          if (tutti.totalDocs >= 300) rifiuta('Troppe richieste in questo momento: riprova più tardi.', 429)

          await req.payload.delete({
            collection: 'codici-email',
            where: { scadenza: { less_than: new Date(Date.now() - 24 * 3600 * 1000).toISOString() } },
            overrideAccess: true,
            req,
          })
          const codice = nuovoCodiceEmail()
          await req.payload.create({
            collection: 'codici-email',
            data: {
              email,
              impronta: improntaCodiceEmail(email, codice),
              scadenza: new Date(Date.now() + VALIDITA_CODICE_MINUTI * 60 * 1000).toISOString(),
            },
            overrideAccess: true,
            req,
          })
          spedisci(req, messaggioCodice(email, codice))
          return json({ ok: true })
        } catch (e) {
          return errore(e)
        }
      },
    },
    {
      path: '/prenota',
      method: 'post',
      handler: async (req) => {
        try {
          const corpo = await leggiCorpo(req)
          const imp = await leggiImpostazioni(req.payload, req)
          if (!imp.attivo) rifiuta('Le prenotazioni sono sospese: riprova più tardi.', 403)
          const documento = imp.documenti.find((d) => d.attivo && d.id === corpo.documento)
          if (!documento) rifiuta('Scegli il documento da ritirare.')
          const inizio = new Date(testo(corpo.inizio))
          if (!turnoValido(imp, inizio)) rifiuta('Questo turno non è disponibile: scegline un altro.', 409)

          const user = req.user as User | null
          let dati: Omit<Partial<PrenotazioneSegreteria>, 'id' | 'createdAt' | 'updatedAt'> & {
            email: string
          }
          if (user) {
            const studente = hasRole(user, 'studente') ? datiStudente(user.email) : null
            dati = {
              tipo: studente ? 'studente' : 'personale',
              utente: user.id,
              email: user.email,
              nome: user.nome || '',
              cognome: user.cognome || '',
              matricola: studente?.matricola,
              telefono: testo(corpo.telefono, 30) || undefined,
            }
          } else {
            const email = normalizzaEmail(testo(corpo.email))
            const nome = testo(corpo.nome, 80)
            const cognome = testo(corpo.cognome, 80)
            const telefono = testo(corpo.telefono, 30)
            if (!nome || !cognome) rifiuta('Scrivi nome e cognome.')
            if (!EMAIL_VALIDA.test(email)) rifiuta('Scrivi un indirizzo email valido.')
            if (ISTITUZIONALE.test(email))
              rifiuta('Con l’email @albertina.academy accedi con Google per prenotare.')
            if (telefono.replace(/\D/g, '').length < 6) rifiuta('Scrivi un numero di telefono.')
            const esito = await verificaCodiceEmail(req.payload, email, testo(corpo.codice, 10), req)
            if (esito === 'scaduto')
              rifiuta('Il codice è scaduto o già usato: chiedine uno nuovo.', 401)
            if (esito === 'errato') rifiuta('Il codice non è corretto: controlla l’email.', 401)
            dati = { tipo: 'esterno', email, nome, cognome, telefono }
          }

          if (await giaPrenotato(req, dati.email!, documento!.nome)) {
            rifiuta(
              `Hai già un appuntamento per “${documento!.nome}”: disdici quello prima di sceglierne un altro.`,
              409,
            )
          }

          const doc = await req.payload
            .create({
              collection: 'prenotazioni-segreteria',
              data: { ...dati, documento: documento!.nome, inizio: inizio.toISOString() },
              overrideAccess: true,
              req,
            })
            .catch((e: { status?: number; message?: string; data?: unknown }) => {
              if (e?.status === 409 || /posto|unique|univoc/i.test(JSON.stringify(e?.data ?? e?.message ?? '')))
                rifiuta(TURNO_PRESO, 409)
              throw e
            })
          return json({ doc: { id: doc.id, documento: doc.documento, inizio: doc.inizio } }, 201)
        } catch (e) {
          return errore(e)
        }
      },
    },
    {
      // Disdetta: dal sito (account) o dal link nell'email (codice)
      path: '/disdici',
      method: 'post',
      handler: async (req) => {
        try {
          const corpo = await leggiCorpo(req)
          const id = Number(corpo.id)
          const p = Number.isFinite(id)
            ? await req.payload
                .findByID({
                  collection: 'prenotazioni-segreteria',
                  id,
                  depth: 0,
                  overrideAccess: true,
                  showHiddenFields: true,
                  req,
                })
                .catch(() => null)
            : null
          const user = req.user as User | null
          const utente = p && typeof p.utente === 'object' ? p.utente?.id : p?.utente
          const autorizzato =
            p &&
            ((user && utente === user.id) ||
              codiceDisdettaValido(testo(corpo.token, 100), p.tokenDisdetta))
          if (!p || !autorizzato) rifiuta('Appuntamento non trovato.', 404)
          if (p!.stato !== 'prenotata') rifiuta('Questo appuntamento è già stato annullato o chiuso.')
          if (new Date(p!.inizio).getTime() <= Date.now())
            rifiuta('L’appuntamento è già passato.')
          await req.payload.update({
            collection: 'prenotazioni-segreteria',
            id: p!.id,
            data: { stato: 'annullata' },
            overrideAccess: true,
            req,
            context: { ...req.context, annullataDa: 'utente' },
          })
          return json({ ok: true })
        } catch (e) {
          return errore(e)
        }
      },
    },
  ],
  hooks: {
    beforeChange: [
      async ({ data, originalDoc, operation, req }) => {
        const prima = originalDoc as PrenotazioneSegreteria | undefined
        if (data.email) data.email = normalizzaEmail(data.email)
        const cognome = data.cognome ?? prima?.cognome
        const nome = data.nome ?? prima?.nome
        data.nominativo = [cognome, nome].filter(Boolean).join(' ') || data.email || prima?.email

        if (operation === 'create') {
          data.stato = data.stato || 'prenotata'
          if (!data.tipo) data.tipo = 'segreteria'
          const { codice, impronta } = nuovoCodiceDisdetta()
          data.tokenDisdetta = impronta
          req.context.codiceDisdetta = codice
        }

        const stato = data.stato ?? prima?.stato
        const inizio = new Date(data.inizio ?? prima?.inizio)
        const spostata = prima && data.inizio && inizio.getTime() !== new Date(prima.inizio).getTime()
        const riattivata = prima?.stato === 'annullata' && stato !== 'annullata'

        if (stato === 'annullata') {
          data.posto = null
          if (prima?.stato !== 'annullata') {
            data.annullataIl = new Date().toISOString()
            data.annullataDa =
              (req.context.annullataDa as string) ||
              (gestisceSportello(req.user) ? 'segreteria' : 'utente')
          }
        } else if (operation === 'create' || spostata || riattivata) {
          const imp = await leggiImpostazioni(req.payload, req)
          const posto = await postoLibero(
            req.payload,
            inizio,
            imp.personePerTurno || 1,
            req,
            prima?.id,
          )
          if (!posto) rifiuta(TURNO_PRESO, 409)
          data.posto = posto
          if (spostata) {
            const { codice, impronta } = nuovoCodiceDisdetta()
            data.tokenDisdetta = impronta
            req.context.codiceDisdetta = codice
          }
        }
        return data
      },
    ],
    afterChange: [
      async ({ doc, previousDoc, operation, req }) => {
        if (req.context?.senzaEmail) return doc
        const p = doc as PrenotazioneSegreteria
        const prima = previousDoc as PrenotazioneSegreteria | undefined
        const codice = req.context.codiceDisdetta as string | undefined
        if (operation === 'create') {
          avvisaConferma(req, p, codice)
        } else if (p.stato === 'annullata' && prima?.stato !== 'annullata') {
          const da = (p.annullataDa ?? 'segreteria') as 'utente' | 'segreteria' | 'chiusura'
          avvisaAnnullamento(
            req,
            p,
            da === 'utente' ? { da } : { da, motivo: p.motivoAnnullamento },
          )
        } else if (codice && p.stato === 'prenotata') {
          // Spostata dalla segreteria: nuova conferma con il nuovo orario
          avvisaConferma(req, p, codice)
        }
        return doc
      },
    ],
  },
  fields: [
    {
      type: 'row',
      fields: [
        {
          name: 'inizio',
          label: 'Giorno e ora',
          type: 'date',
          required: true,
          index: true,
          admin: {
            width: '40%',
            date: {
              pickerAppearance: 'dayAndTime',
              displayFormat: 'EEEE d MMMM yyyy, HH:mm',
              timeIntervals: 5,
            },
            description: 'Se lo cambi, la persona riceve un’email con il nuovo orario.',
          },
        },
        {
          name: 'documento',
          label: 'Documento',
          type: 'text',
          required: true,
          index: true,
          admin: { width: '40%' },
        },
        {
          name: 'stato',
          label: 'Stato',
          type: 'select',
          index: true,
          defaultValue: 'prenotata',
          options: STATI.map((value) => ({ value, label: STATO_LABELS[value] })),
          admin: { width: '20%' },
        },
      ],
    },
    {
      name: 'motivoAnnullamento',
      label: 'Motivo dell’annullamento',
      type: 'text',
      admin: {
        condition: (d) => d?.stato === 'annullata',
        description: 'Facoltativo: compare nell’email a chi aveva prenotato.',
      },
    },
    {
      type: 'row',
      fields: [
        { name: 'cognome', label: 'Cognome', type: 'text', admin: { width: '35%' } },
        { name: 'nome', label: 'Nome', type: 'text', admin: { width: '35%' } },
        { name: 'matricola', label: 'Matricola', type: 'text', admin: { width: '30%' } },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'email',
          label: 'Email',
          type: 'email',
          required: true,
          index: true,
          admin: { width: '50%' },
        },
        { name: 'telefono', label: 'Telefono', type: 'text', admin: { width: '50%' } },
      ],
    },
    {
      name: 'noteSegreteria',
      label: 'Note della segreteria',
      type: 'textarea',
      admin: { description: 'Solo per la segreteria: chi prenota non le vede.' },
    },
    {
      type: 'row',
      fields: [
        {
          name: 'tipo',
          label: 'Prenotato da',
          type: 'select',
          options: [
            { value: 'studente', label: 'Studente (account istituzionale)' },
            { value: 'personale', label: 'Personale (account istituzionale)' },
            { value: 'esterno', label: 'Esterno (email verificata)' },
            { value: 'segreteria', label: 'Segreteria' },
          ],
          admin: { readOnly: true, width: '50%' },
        },
        {
          name: 'utente',
          label: 'Account',
          type: 'relationship',
          relationTo: 'users',
          index: true,
          admin: { readOnly: true, width: '50%' },
        },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'annullataDa',
          label: 'Annullata da',
          type: 'select',
          options: [
            { value: 'utente', label: 'Chi aveva prenotato' },
            { value: 'segreteria', label: 'Segreteria' },
            { value: 'chiusura', label: 'Chiusura dello sportello' },
          ],
          admin: { readOnly: true, width: '50%', condition: (d) => d?.stato === 'annullata' },
        },
        {
          name: 'annullataIl',
          label: 'Annullata il',
          type: 'date',
          admin: {
            readOnly: true,
            width: '50%',
            condition: (d) => d?.stato === 'annullata',
            date: { pickerAppearance: 'dayAndTime', displayFormat: 'd MMMM yyyy, HH:mm' },
          },
        },
      ],
    },
    { name: 'nominativo', type: 'text', admin: { hidden: true } },
    // Turno occupato ("istante|n"), unico nel database; vuoto quando l'appuntamento è annullato
    {
      name: 'posto',
      type: 'text',
      unique: true,
      hidden: true,
      access: { read: nessuno, update: nessuno, create: nessuno },
    },
    {
      name: 'tokenDisdetta',
      type: 'text',
      hidden: true,
      access: { read: nessuno, update: nessuno, create: nessuno },
    },
  ],
}
