import type { Payload } from 'payload'

/**
 * Docenti tolti dal sito su richiesta (account WordPress eliminato): l'anteprima li aveva già
 * importati, quindi a ogni avvio si rimuovono insieme al ritratto. I corsi restano, senza docente.
 */
export const DOCENTI_RIMOSSI = ['daniele.galliano@albertina.academy']

export async function rimuoviDocenti(payload: Payload) {
  const { docs } = await payload.find({
    collection: 'docenti',
    where: { email: { in: DOCENTI_RIMOSSI } },
    depth: 0,
    limit: DOCENTI_RIMOSSI.length,
    overrideAccess: true,
  })
  for (const d of docs) {
    const foto = typeof d.foto === 'object' ? d.foto?.id : d.foto
    await payload.delete({ collection: 'docenti', id: d.id, overrideAccess: true })
    if (foto) await payload.delete({ collection: 'media', id: foto, overrideAccess: true })
    payload.logger.info(`Docente rimosso: ${d.nomeCompleto ?? d.email}`)
  }
}
