import type { Payload, PayloadRequest } from 'payload'

import { statoFinestra } from '@/access/iscrizioni'
import type { Corso, FinestraIscrizione } from '@/payload-types'

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
