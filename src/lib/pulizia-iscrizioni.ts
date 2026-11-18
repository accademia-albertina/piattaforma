import type { Endpoint, PayloadRequest, Where } from 'payload'

import { annoConcluso } from '@/access/corsi'
import { gestisceIscrizioni } from '@/access/iscrizioni'
import { conta, registraOperazione } from '@/lib/registro'
import { SENZA_REGISTRO } from '@/lib/registro/costanti'

/**
 * POST /api/finestre-iscrizione/:id/pulizia — cancella tutte le iscrizioni dello stesso tipo
 * (corsi o esami) e anno accademico della finestra. Solo uffici, solo anni conclusi, senza
 * email agli studenti. Prima si scarica il CSV dell'anno dalla stessa finestra.
 */
export const endpointPulizia: Endpoint = {
  path: '/:id/pulizia',
  method: 'post',
  handler: async (req: PayloadRequest) => {
    if (!gestisceIscrizioni(req.user)) {
      return Response.json(
        { message: 'Solo gli uffici possono eliminare le iscrizioni.' },
        { status: 403 },
      )
    }
    const id = Number(req.routeParams?.id)
    const finestra = await req.payload
      .findByID({ collection: 'finestre-iscrizione', id, depth: 0, req })
      .catch(() => null)
    if (!finestra) return Response.json({ message: 'Finestra non trovata.' }, { status: 404 })
    const anno = finestra.annoAccademico
    if (!annoConcluso(anno)) {
      return Response.json(
        { message: `Il ${anno} non è ancora concluso: le sue iscrizioni servono ancora.` },
        { status: 400 },
      )
    }
    const esami = finestra.tipo === 'esami'
    const where: Where = esami
      ? { annoAccademico: { equals: anno } }
      : { 'corso.annoAccademico': { equals: anno } }
    const { docs, errors } = await req.payload.delete({
      collection: esami ? 'iscrizioni-esami' : 'iscrizioni-corsi',
      where,
      req,
      depth: 0,
      // Una voce sola nel registro per tutta la pulizia, non una per iscrizione
      context: { senzaEmail: true, [SENZA_REGISTRO]: true },
    })
    req.payload.logger.info(
      `Pulizia iscrizioni ${esami ? 'esami' : 'corsi'} ${anno}: ${docs.length} eliminate da ${req.user?.email}`,
    )
    const collezione = esami ? 'iscrizioni-esami' : 'iscrizioni-corsi'
    await registraOperazione(req.payload, req.user, {
      azione: 'eliminato',
      collezione,
      sezione: esami ? 'Iscrizioni agli esami' : 'Iscrizioni ai corsi',
      titolo: `Pulizia annuale delle iscrizioni ${anno}`,
      dettagli: `${conta(docs.length, 'iscrizione eliminata', 'iscrizioni eliminate')}${errors.length ? `, ${errors.length} non eliminate` : ''}`,
    })
    return Response.json({ eliminate: docs.length, errori: errors.length })
  },
}
