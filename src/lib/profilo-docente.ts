import type { Payload, PayloadRequest } from 'payload'

import type { User } from '@/payload-types'

/** «mario.rossi@…» → Mario, Rossi (quando Google non ha dato nome e cognome). */
function daEmail(email: string) {
  const [nome = '', ...resto] = email.split('@')[0].split('.')
  const maiuscola = (s: string) =>
    s
      .split('-')
      .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
      .join('-')
  return { nome: maiuscola(nome), cognome: resto.map(maiuscola).join(' ') }
}

/**
 * Chi ha il ruolo Docente ha sempre un profilo pubblico in Docenti, collegato all’account:
 * quello con la stessa email se c’è (e non è di un altro), altrimenti uno nuovo, in servizio.
 * Così un docente aggiunto come utente compare da solo in /docenti; nelle pagine delle scuole
 * compare quando nel profilo si sceglie la scuola (o le scuole) a cui afferisce.
 */
export async function assicuraProfiloDocente(payload: Payload, utente: User, req?: PayloadRequest) {
  if (!utente.roles?.includes('docente')) return
  const collegato = await payload.count({
    collection: 'docenti',
    where: { account: { equals: utente.id } },
    overrideAccess: true,
    req,
  })
  if (collegato.totalDocs > 0) return

  const email = utente.email.toLowerCase()
  const { docs } = await payload.find({
    collection: 'docenti',
    where: { and: [{ email: { equals: email } }, { account: { exists: false } }] },
    limit: 1,
    depth: 0,
    overrideAccess: true,
    req,
  })
  if (docs[0]) {
    await payload.update({
      collection: 'docenti',
      id: docs[0].id,
      data: { account: utente.id, attivo: true },
      overrideAccess: true,
      req,
    })
    return
  }
  const ricavato = daEmail(email)
  const nome = utente.nome?.trim() || ricavato.nome
  const cognome = utente.cognome?.trim() || ricavato.cognome || nome
  await payload.create({
    collection: 'docenti',
    data: { nome, cognome, email, account: utente.id, attivo: true },
    overrideAccess: true,
    req,
  })
  payload.logger.info(`Profilo docente creato per ${email}.`)
}
