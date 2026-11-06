import type { Payload, Where } from 'payload'

import { datiStudente } from '@/access/iscrizioni'
import type { Appello, IscrizioneEsame, User } from '@/payload-types'

import { dataIscrizioni, iscrizioniDellAppello } from './iscrizioni'

const giornoLungo = new Intl.DateTimeFormat('it-IT', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  timeZone: 'Europe/Rome',
})

/** “martedì 22 settembre 2026”. */
export const giornoAppello = (d: string | Date) => giornoLungo.format(new Date(d))

/** Inizio di oggi (gli appelli di oggi restano visibili fino a domani). */
function oggi() {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d.toISOString()
}

export type AppelloConStato = {
  appello: Appello
  stato: Awaited<ReturnType<typeof iscrizioniDellAppello>>['stato']
  apertura?: string
  chiusura?: string
  iscrizioneId: number | null
  livelloAmmesso: boolean
}

/**
 * Appelli futuri (filtrati con `where`), con lo stato delle iscrizioni e, per uno studente,
 * la sua eventuale iscrizione.
 */
export async function appelliConStato(
  payload: Payload,
  where: Where,
  utente?: Pick<User, 'id' | 'email' | 'roles'> | null,
): Promise<AppelloConStato[]> {
  const { docs } = await payload.find({
    collection: 'appelli',
    where: { and: [where, { data: { greater_than_equal: oggi() } }] },
    sort: 'data',
    depth: 2,
    limit: 500,
  })
  const studente = utente?.roles?.includes('studente') ? datiStudente(utente.email) : null
  const mie = new Map<number, number>()
  if (studente && utente && docs.length) {
    const { docs: iscrizioni } = await payload.find({
      collection: 'iscrizioni-esami',
      where: {
        studente: { equals: utente.id },
        appello: { in: docs.map((a) => a.id) },
      },
      depth: 0,
      limit: 500,
    })
    for (const i of iscrizioni as IscrizioneEsame[]) {
      mie.set(typeof i.appello === 'object' ? i.appello.id : i.appello, i.id)
    }
  }
  return Promise.all(
    docs.map(async (appello) => {
      const f = await iscrizioniDellAppello(payload, appello)
      return {
        appello,
        stato: f.stato,
        apertura: f.apertura ? dataIscrizioni(f.apertura) : undefined,
        chiusura: f.chiusura ? dataIscrizioni(f.chiusura) : undefined,
        iscrizioneId: mie.get(appello.id) ?? null,
        livelloAmmesso: !studente || (appello.livelli ?? []).includes(studente.livello),
      }
    }),
  )
}
