import type { Payload, PayloadRequest } from 'payload'

import { statoFinestra } from '@/access/iscrizioni'
import type { Appello, Corso, FinestraIscrizione } from '@/payload-types'

type CorsoPerFinestra = Pick<Corso, 'annoAccademico' | 'periodoIscrizione' | 'prorogaIscrizioni'>

/** La finestra di iscrizione che vale per un corso: stesso anno accademico e semestre. */
export async function finestraDelCorso(
  payload: Payload,
  corso: CorsoPerFinestra,
  req?: PayloadRequest,
): Promise<FinestraIscrizione | null> {
  const { docs } = await payload.find({
    collection: 'finestre-iscrizione',
    where: {
      tipo: { equals: 'corsi' },
      annoAccademico: { equals: corso.annoAccademico },
      periodo: { equals: corso.periodoIscrizione ?? 'primo' },
    },
    limit: 1,
    depth: 0,
    req,
  })
  return docs[0] ?? null
}

/** Mezzanotte (ora di Roma) del giorno a cui appartiene la data. */
export function inizioGiornoRoma(data: string | Date): Date {
  const d = new Date(data)
  const parti = Object.fromEntries(
    new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Europe/Rome',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      timeZoneName: 'longOffset',
    })
      .formatToParts(d)
      .map((p) => [p.type, p.value]),
  )
  const offset = parti.timeZoneName === 'GMT' ? '+00:00' : parti.timeZoneName.replace('GMT', '')
  return new Date(`${parti.year}-${parti.month}-${parti.day}T00:00:00${offset}`)
}

/** La finestra di una sessione d'esami. */
export async function finestraDellaSessione(
  payload: Payload,
  appello: Pick<Appello, 'annoAccademico' | 'sessione'>,
  req?: PayloadRequest,
): Promise<FinestraIscrizione | null> {
  const { docs } = await payload.find({
    collection: 'finestre-iscrizione',
    where: {
      tipo: { equals: 'esami' },
      annoAccademico: { equals: appello.annoAccademico },
      periodo: { equals: appello.sessione },
    },
    limit: 1,
    depth: 0,
    req,
  })
  return docs[0] ?? null
}

type AppelloPerFinestra = Pick<
  Appello,
  'annoAccademico' | 'sessione' | 'prorogaIscrizioni' | 'data'
>

/**
 * Stato delle iscrizioni a un appello adesso. Oltre alla finestra della sessione (e alla proroga
 * del docente), le iscrizioni chiudono comunque alle 23:59 del giorno prima dell'esame.
 */
export async function iscrizioniDellAppello(
  payload: Payload,
  appello: AppelloPerFinestra,
  req?: PayloadRequest,
  ora = new Date(),
) {
  const finestra = await finestraDellaSessione(payload, appello, req)
  const stato = statoFinestra(finestra, appello.prorogaIscrizioni, ora)
  // Ultimo minuto del giorno prima dell'esame, ora di Roma
  const limite = new Date(inizioGiornoRoma(appello.data).getTime() - 60_000)
  if (stato.chiusura && limite < stato.chiusura) {
    stato.chiusura = limite
    if (ora > limite) stato.stato = 'chiusa'
  }
  return { ...stato, soloIscrittiAlCorso: Boolean(finestra?.soloIscrittiAlCorso) }
}

/** Stato delle iscrizioni a un corso adesso, proroga del docente compresa. */
export async function iscrizioniDelCorso(
  payload: Payload,
  corso: CorsoPerFinestra,
  req?: PayloadRequest,
  ora = new Date(),
) {
  const finestra = await finestraDelCorso(payload, corso, req)
  return statoFinestra(finestra, corso.prorogaIscrizioni, ora)
}

const formato = new Intl.DateTimeFormat('it-IT', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  timeZone: 'Europe/Rome',
})

/** “12 febbraio 2027, 23:59”. */
export const dataIscrizioni = (d: Date | string) => formato.format(new Date(d))
