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

const laMiaArea = () => ({ testo: 'Vai a La mia area', url: `${sito()}/la-mia-area` })

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
  const periodo = etichettaPeriodo(corso.periodoIscrizione ?? 'primo')
  const link = `${sito()}/corsi/${corso.slug}`
  const dettagli = [
    { etichetta: 'Corso', valore: corso.titolo },
    { etichetta: 'Periodo', valore: `${periodo} ${corso.annoAccademico}` },
  ]
  if (azione === 'iscrizione') {
    return {
      to: iscrizione.email,
      subject: `Iscrizione al corso ${corso.titolo}`,
      contenuto: {
        occhiello: 'Iscrizione ai corsi',
        titolo: 'Iscrizione registrata',
        saluto: saluto(iscrizione.nominativo),
        paragrafi: [`la tua iscrizione al corso ${corso.titolo} è registrata.`],
        dettagli,
        pulsante: laMiaArea(),
        note: [fraseChiusura(chiusura), `Pagina del corso: ${link}`],
      },
    }
  }
  return {
    to: iscrizione.email,
    subject: `Iscrizione annullata: ${corso.titolo}`,
    contenuto: {
      occhiello: 'Iscrizione ai corsi',
      titolo: 'Iscrizione annullata',
      saluto: saluto(iscrizione.nominativo),
      paragrafi: [
        `la tua iscrizione al corso ${corso.titolo} è stata annullata.`,
        `Se non l’hai annullata tu, iscriviti di nuovo dalla pagina del corso finché le iscrizioni sono aperte.`,
      ],
      dettagli,
      pulsante: { testo: 'Apri la pagina del corso', url: link },
    },
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
  const dettagli = [
    { etichetta: 'Esame', valore: nome },
    { etichetta: 'Quando', valore: quando },
    ...(appello.aula ? [{ etichetta: 'Aula', valore: appello.aula }] : []),
  ]
  if (azione === 'iscrizione') {
    return {
      to: iscrizione.email,
      subject: `Iscrizione all’esame di ${nome}`,
      contenuto: {
        occhiello: 'Iscrizione agli esami',
        titolo: 'Iscrizione registrata',
        saluto: saluto(iscrizione.nominativo),
        paragrafi: [
          `la tua iscrizione all’esame di ${nome} è registrata.`,
          'Controlla data, ora e aula sul sito prima dell’esame: eventuali cambi li trovi in La mia area.',
        ],
        dettagli,
        pulsante: laMiaArea(),
        note: [fraseChiusura(chiusura)],
      },
    }
  }
  return {
    to: iscrizione.email,
    subject: `Iscrizione annullata: esame di ${nome}`,
    contenuto: {
      occhiello: 'Iscrizione agli esami',
      titolo: 'Iscrizione annullata',
      saluto: saluto(iscrizione.nominativo),
      paragrafi: [
        `la tua iscrizione all’esame di ${nome} è stata annullata.`,
        'Se non l’hai annullata tu, iscriviti di nuovo dalla pagina degli esami finché le iscrizioni sono aperte.',
      ],
      dettagli,
      pulsante: { testo: 'Apri la pagina degli esami', url: `${sito()}/esami` },
    },
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
