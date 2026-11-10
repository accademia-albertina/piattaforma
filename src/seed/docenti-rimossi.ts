import { createHash } from 'node:crypto'

import type { Payload } from 'payload'

/**
 * Docenti tolti dal sito su richiesta (account WordPress eliminato): l'anteprima li aveva già
 * importati, quindi a ogni avvio si rimuovono insieme al ritratto. I corsi restano, senza docente.
 * Il repository è pubblico: qui c'è solo l'impronta SHA-256 dell'email (minuscola), non l'email.
 */
export const DOCENTI_RIMOSSI = ['865d2f628636a83078d97d45700100e968e05d35fbfe46b2ad7ee0f736c5365d']

export const impronta = (email: string) =>
  createHash('sha256').update(email.trim().toLowerCase()).digest('hex')

export async function rimuoviDocenti(payload: Payload) {
  const { docs } = await payload.find({
    collection: 'docenti',
    depth: 0,
    pagination: false,
    select: { email: true, nomeCompleto: true, foto: true },
    overrideAccess: true,
  })
  for (const d of docs.filter((d) => d.email && DOCENTI_RIMOSSI.includes(impronta(d.email)))) {
    const foto = typeof d.foto === 'object' ? d.foto?.id : d.foto
    await payload.delete({ collection: 'docenti', id: d.id, overrideAccess: true })
    if (foto) await payload.delete({ collection: 'media', id: foto, overrideAccess: true })
    payload.logger.info(`Docente rimosso: ${d.nomeCompleto ?? d.email}`)
  }
}
