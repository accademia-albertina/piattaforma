import type { PayloadRequest } from 'payload'

import { etichettaPeriodo } from '@/access/iscrizioni'
import { dataIscrizioni, iscrizioniDelCorso, iscrizioniDellAppello } from '@/lib/iscrizioni'
import { giornoAppello } from '@/lib/appelli'
import { spedisci, type Messaggio } from '@/lib/email'
import type { Appello, Corso, IscrizioneCorso, IscrizioneEsame } from '@/payload-types'

const idDi = (v: unknown) =>
  (typeof v === 'object' && v ? (v as { id: number }).id : v) as number | undefined

const sito = () =>
  (process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000').replace(/\/$/, '')

const saluto = (nominativo?: string | null) => {
  const nome = nominativo?.trim()
  return nome ? `Gentile ${nome},` : 'Buongiorno,'
}

const firma = () =>
  [
    `Trovi le tue iscrizioni in La mia area: ${sito()}/la-mia-area`,
    'Questa email è automatica: per domande scrivi alla segreteria didattica.',
    'Accademia Albertina di Belle Arti di Torino',
  ].join('\n\n')

const fraseChiusura = (chiusura?: Date) =>
  chiusura
    ? `Puoi annullare l’iscrizione da La mia area fino al ${dataIscrizioni(chiusura)}.`
    : 'Puoi annullare l’iscrizione da La mia area finché le iscrizioni sono aperte.'

/** Testo dell'email per un'iscrizione a un corso, nuova o annullata. */
export function messaggioCorso(
  iscrizione: Pick<IscrizioneCorso, 'email' | 'nominativo'>,
  corso: Pick<Corso, 'titolo' | 'slug' | 'annoAccademico' | 'periodoIscrizione'>,
  azione: 'iscrizione' | 'annullamento',
  chiusura?: Date,
): Messaggio | null {
  if (!iscrizione.email) return null
  const periodo = etichettaPeriodo(corso.periodoIscrizione ?? 'primo').toLowerCase()
  const riga = `${corso.titolo}, ${periodo} ${corso.annoAccademico}`
  const link = `${sito()}/corsi/${corso.slug}`
  if (azione === 'iscrizione') {
    return {
      to: iscrizione.email,
      subject: `Iscrizione al corso ${corso.titolo}`,
      text: [
        saluto(iscrizione.nominativo),
        `la tua iscrizione al corso ${riga} è registrata.`,
        `Pagina del corso: ${link}`,
        fraseChiusura(chiusura),
        firma(),
      ].join('\n\n'),
    }
  }
  return {
    to: iscrizione.email,
    subject: `Iscrizione annullata: ${corso.titolo}`,
    text: [
      saluto(iscrizione.nominativo),
      `la tua iscrizione al corso ${riga} è stata annullata.`,
      `Se non l’hai annullata tu, iscriviti di nuovo dalla pagina del corso finché le iscrizioni sono aperte: ${link}`,
      firma(),
    ].join('\n\n'),
  }
}

type AppelloPerEmail = Pick<Appello, 'titolo' | 'data' | 'ora' | 'aula'> & {
  corso?: unknown
}

/** Testo dell'email per un'iscrizione a un appello, nuova o annullata. */
export function messaggioEsame(
  iscrizione: Pick<IscrizioneEsame, 'email' | 'nominativo'>,
  appello: AppelloPerEmail,
  corso: Pick<Corso, 'titolo'> | null,
  azione: 'iscrizione' | 'annullamento',
  chiusura?: Date,
): Messaggio | null {
  if (!iscrizione.email) return null
  const nome = corso?.titolo ?? appello.titolo ?? 'esame'
  const quando = [giornoAppello(appello.data), appello.ora && `ore ${appello.ora}`]
    .filter(Boolean)
    .join(', ')
  const dettagli = [`Quando: ${quando}`, appello.aula && `Aula: ${appello.aula}`]
    .filter(Boolean)
    .join('\n')
  if (azione === 'iscrizione') {
    return {
      to: iscrizione.email,
      subject: `Iscrizione all’esame di ${nome}`,
      text: [
        saluto(iscrizione.nominativo),
        `la tua iscrizione all’esame di ${nome} è registrata.`,
        dettagli,
        'Controlla data, ora e aula sul sito prima dell’esame: eventuali cambi li trovi in La mia area.',
        fraseChiusura(chiusura),
        firma(),
      ].join('\n\n'),
    }
  }
  return {
    to: iscrizione.email,
    subject: `Iscrizione annullata: esame di ${nome}`,
    text: [
      saluto(iscrizione.nominativo),
      `la tua iscrizione all’esame di ${nome} (${quando}) è stata annullata.`,
      `Se non l’hai annullata tu, iscriviti di nuovo da ${sito()}/esami finché le iscrizioni sono aperte.`,
      firma(),
    ].join('\n\n'),
  }
}

/** Dopo un'iscrizione o un annullamento a un corso: avvisa lo studente. */
export async function avvisaCorso(
  req: PayloadRequest,
  iscrizione: IscrizioneCorso,
  azione: 'iscrizione' | 'annullamento',
) {
  if (req.context?.senzaEmail) return
  try {
    const corso = await req.payload.findByID({
      collection: 'corsi',
      id: idDi(iscrizione.corso)!,
      depth: 0,
      req,
    })
    const { chiusura } = await iscrizioniDelCorso(req.payload, corso, req)
    spedisci(req, messaggioCorso(iscrizione, corso, azione, chiusura))
  } catch (err) {
    req.payload.logger.error({ err, msg: 'Email di iscrizione al corso non preparata' })
  }
}

/** Dopo un'iscrizione o un annullamento a un esame: avvisa lo studente. */
export async function avvisaEsame(
  req: PayloadRequest,
  iscrizione: IscrizioneEsame,
  azione: 'iscrizione' | 'annullamento',
) {
  if (req.context?.senzaEmail) return
  try {
    const appello = await req.payload.findByID({
      collection: 'appelli',
      id: idDi(iscrizione.appello)!,
      depth: 0,
      req,
    })
    const corso = await req.payload
      .findByID({ collection: 'corsi', id: idDi(appello.corso)!, depth: 0, req })
      .catch(() => null)
    const { chiusura } = await iscrizioniDellAppello(req.payload, appello, req)
    spedisci(req, messaggioEsame(iscrizione, appello, corso, azione, chiusura))
  } catch (err) {
    req.payload.logger.error({ err, msg: 'Email di iscrizione all’esame non preparata' })
  }
}
