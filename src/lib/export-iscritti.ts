import type { Endpoint, PayloadRequest, Where } from 'payload'

import { LIVELLO_LABELS, isAnnoAccademico, type Livello } from '@/access/corsi'
import { gestisceIscrizioni } from '@/access/iscrizioni'
import { hasRole } from '@/access/roles'
import type { IscrizioneCorso, IscrizioneEsame } from '@/payload-types'

const ora = new Intl.DateTimeFormat('it-IT', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  timeZone: 'Europe/Rome',
})

/** Cella CSV per Excel italiano (separatore “;”), con protezione dalle formule. */
export function cella(v: unknown): string {
  let s = v == null ? '' : String(v)
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`
  return /[";\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

export const rigaCsv = (valori: unknown[]) => valori.map(cella).join(';')

const titoloDi = (v: unknown) =>
  typeof v === 'object' && v ? ((v as { titolo?: string }).titolo ?? '') : ''

type Iscrizione = IscrizioneCorso | IscrizioneEsame

export function csvIscritti(iscrizioni: Iscrizione[], colonnaRiferimento: 'Corso' | 'Appello') {
  const righe = [
    rigaCsv(['Cognome e nome', 'Matricola', 'Livello', 'Email', colonnaRiferimento, 'Iscritto il']),
    ...iscrizioni.map((i) =>
      rigaCsv([
        i.nominativo,
        i.matricola,
        i.livello ? LIVELLO_LABELS[i.livello as Livello] : '',
        i.email,
        'appello' in i ? titoloDi(i.appello) : titoloDi(i.corso),
        ora.format(new Date(i.createdAt)),
      ]),
    ),
  ]
  // BOM: Excel riconosce l'UTF-8 (accenti) solo con questo
  return '﻿' + righe.join('\r\n') + '\r\n'
}

const nomeFile = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase()
    .slice(0, 80) || 'iscritti'

/**
 * GET /api/<collezione>/export?<riferimento>=ID oppure ?anno=2026/2027 (solo uffici).
 * Si leggono le iscrizioni con i permessi di chi chiede: il docente scarica solo i suoi iscritti.
 */
export function endpointExport(
  collezione: 'iscrizioni-corsi' | 'iscrizioni-esami',
  riferimento: 'corso' | 'appello',
): Endpoint {
  return {
    path: '/export',
    method: 'get',
    handler: async (req: PayloadRequest) => {
      if (!req.user) return Response.json({ message: 'Accedi per scaricare.' }, { status: 401 })
      if (!gestisceIscrizioni(req.user) && !hasRole(req.user, 'docente')) {
        return Response.json({ message: 'Non puoi scaricare questo elenco.' }, { status: 403 })
      }
      const params = new URL(req.url ?? '', 'http://x').searchParams
      const id = Number(params.get(riferimento))
      const anno = params.get('anno')
      let where: Where
      let nome: string
      if (id) {
        where = { [riferimento]: { equals: id } }
        const doc = await req.payload
          .findByID({
            collection: riferimento === 'corso' ? 'corsi' : 'appelli',
            id,
            depth: 0,
            req,
            overrideAccess: false,
          })
          .catch(() => null)
        if (!doc) return Response.json({ message: 'Non trovato.' }, { status: 404 })
        nome = `iscritti-${(doc as { titolo?: string }).titolo ?? id}`
      } else if (anno && isAnnoAccademico(anno) && gestisceIscrizioni(req.user)) {
        where =
          collezione === 'iscrizioni-esami'
            ? { annoAccademico: { equals: anno } }
            : { 'corso.annoAccademico': { equals: anno } }
        nome = `${collezione}-${anno}`
      } else {
        return Response.json({ message: 'Indica cosa scaricare.' }, { status: 400 })
      }
      const { docs } = await req.payload.find({
        collection: collezione,
        where,
        depth: 1,
        pagination: false,
        sort: riferimento === 'corso' ? ['corso', 'nominativo'] : ['appello', 'nominativo'],
        req,
        overrideAccess: false,
        user: req.user,
        select: {
          nominativo: true,
          matricola: true,
          livello: true,
          email: true,
          createdAt: true,
          [riferimento]: true,
        },
        populate: { [riferimento === 'corso' ? 'corsi' : 'appelli']: { titolo: true } },
      })
      return new Response(
        csvIscritti(docs as Iscrizione[], riferimento === 'corso' ? 'Corso' : 'Appello'),
        {
          headers: {
            'Content-Type': 'text/csv; charset=utf-8',
            'Content-Disposition': `attachment; filename="${nomeFile(nome)}.csv"`,
            'Cache-Control': 'no-store',
          },
        },
      )
    },
  }
}
