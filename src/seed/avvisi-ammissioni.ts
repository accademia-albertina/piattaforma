/**
 * Pagina Ammissioni: la fisarmonica statica "Avvisi dei coordinatori" diventa il blocco
 * "Avvisi di ammissione", che legge gli avvisi scritti dai coordinatori di scuola. Le voci di
 * oggi (una per scuola) diventano avvisi della categoria Ammissioni. Una volta sola: se la
 * pagina ha già il blocco nuovo, o non ha più la fisarmonica, non fa niente.
 */
import type { Payload } from 'payload'

import { CATEGORIA_AMMISSIONI } from '@/access/avvisi'
import type { Pagina } from '@/payload-types'

const PERCORSO = 'didattica/ammissioni'
const TITOLO_SEZIONE = 'Avvisi dei coordinatori'

/** Confronto dei nomi delle scuole senza badare ad apostrofi e maiuscole. */
const chiave = (s: string) => s.replace(/[’']/g, "'").trim().toLowerCase()

export async function convertiAvvisiAmmissioni(payload: Payload, ora = new Date()) {
  const { docs } = await payload.find({
    collection: 'pagine',
    where: { percorso: { equals: PERCORSO } },
    limit: 1,
    depth: 0,
    overrideAccess: true,
  })
  const pagina = docs[0]
  if (!pagina?.blocchi?.length) return
  if (pagina.blocchi.some((b) => b.blockType === 'avvisiAmmissioni')) return
  const indice = pagina.blocchi.findIndex(
    (b) => b.blockType === 'fisarmonica' && chiave(b.titolo ?? '') === chiave(TITOLO_SEZIONE),
  )
  if (indice < 0) return
  const vecchio = pagina.blocchi[indice] as Extract<
    NonNullable<Pagina['blocchi']>[number],
    { blockType: 'fisarmonica' }
  >

  const scuole = await payload.find({
    collection: 'scuole',
    limit: 50,
    depth: 0,
    pagination: false,
    overrideAccess: true,
    select: { nome: true },
  })
  const perNome = new Map(scuole.docs.map((s) => [chiave(s.nome), s]))

  let creati = 0
  for (const voce of vecchio.voci) {
    const scuola = perNome.get(chiave(voce.titolo))
    if (!scuola) {
      payload.logger.warn(`Avvisi di ammissione: scuola “${voce.titolo}” non trovata, voce saltata`)
      continue
    }
    await payload.create({
      collection: 'avvisi',
      data: {
        // Con il nome della scuola: in /avvisi gli avvisi stanno uno accanto all'altro
        titolo: `Esami di ammissione ${ora.getFullYear()} – ${scuola.nome}`,
        categorie: [CATEGORIA_AMMISSIONI],
        scuole: [scuola.id],
        contenuto: voce.testo,
        pubblicatoIl: ora.toISOString(),
        _status: 'published',
      },
      draft: false,
      overrideAccess: true,
    })
    creati++
  }

  const blocchi = [...pagina.blocchi]
  blocchi.splice(indice, 1, { blockType: 'avvisiAmmissioni', titolo: TITOLO_SEZIONE })
  // Salvataggio normale: la pagina risulta modificata nel pannello, così un riallineamento
  // a WordPress non rimette la fisarmonica statica.
  await payload.update({
    collection: 'pagine',
    id: pagina.id,
    data: { blocchi: blocchi.map(({ id: _id, ...b }) => b) as never },
    draft: false,
    overrideAccess: true,
  })
  payload.logger.info(`Pagina Ammissioni: ${creati} avvisi di ammissione dalle voci statiche.`)
}
