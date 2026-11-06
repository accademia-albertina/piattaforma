/**
 * Affida alla Biblioteca le sue pagine e i suoi avvisi.
 * Si scrive solo dove nessuno ha già deciso: uffici vuoti sulle pagine,
 * avvisi rimasti con la sola categoria "Generali".
 */
import type { Payload } from 'payload'

export const PAGINE_BIBLIOTECA = ['accademia/biblioteca', 'accademia/albertina-press']

/** Avvisi del sito attuale su orari, chiusure e acquisizioni della biblioteca. */
export const AVVISI_BIBLIOTECA = [
  'chiusura-straordinaria-biblioteca',
  'chiusura-biblioteca-venerdi-21-marzo-2025',
  'biblioteca-nuove-acquisizioni',
  'apertura-biblioteca-14-maggio',
  'variazione-orari-biblioteca',
  'chiusura-biblioteca-13-11',
  'variazioni-orario-biblioteca',
  'chiusura-straordinaria-biblioteca-19-02',
  'venerdi-6-marzo-chiusura-biblioteca',
  'chiusura-biblioteca',
  'biblioteca-dellaccademia-albertina-restera-chiusa-venerdi-12-giugno',
  'orari-biblioteca-periodo-estivo',
  'orari-biblioteca-settembre-2026',
  'apertura-posticipata-biblioteca-5-ottobre-2026',
  '14-ottobre-2026-chiusura-anticipata-biblioteca-ore-1300',
]

export async function affidaBiblioteca(payload: Payload) {
  const pagine = await payload.find({
    collection: 'pagine',
    where: { percorso: { in: PAGINE_BIBLIOTECA } },
    pagination: false,
    depth: 0,
    select: { ufficiEditori: true },
    overrideAccess: true,
  })
  for (const p of pagine.docs) {
    if (p.ufficiEditori?.length) continue
    await payload.update({
      collection: 'pagine',
      id: p.id,
      data: { ufficiEditori: ['biblioteca'] },
      context: { importazione: true },
      overrideAccess: true,
    })
  }

  const avvisi = await payload.find({
    collection: 'avvisi',
    where: { slug: { in: AVVISI_BIBLIOTECA } },
    pagination: false,
    depth: 0,
    select: { categorie: true },
    overrideAccess: true,
  })
  let spostati = 0
  for (const a of avvisi.docs) {
    if (a.categorie?.length !== 1 || a.categorie[0] !== 'generali') continue
    await payload.update({
      collection: 'avvisi',
      id: a.id,
      data: { categorie: ['biblioteca'] },
      context: { importazione: true },
      overrideAccess: true,
    })
    spostati++
  }
  if (spostati) payload.logger.info(`Biblioteca: ${spostati} avvisi spostati nella sua categoria.`)
}
