/**
 * Profili dei dottorandi dal sito attuale (sottopagine di /dottorati/albertina/dottorandi):
 * biografia, progetto di ricerca ed email. Il file dottorandi-wp.json.gz si genera con
 * scripts/wp/converti-dottorandi.ts. Crea i dottorandi che mancano e riempie solo i campi vuoti,
 * foto comprese (da foto-dottorandi/<slug>.webp, se c'è), così non sovrascrive il pannello.
 * Toglie poi da Pagine i vecchi profili importati come pagine. Si può rilanciare a ogni avvio.
 */
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { gunzipSync } from 'node:zlib'
import type { Payload } from 'payload'

import type { Dottorando } from '@/payload-types'

const dirname = path.dirname(fileURLToPath(import.meta.url))

export const PERCORSO_DOTTORANDI = 'dottorati/albertina/dottorandi'

type DottorandoWp = {
  wpId: number
  slugWp: string
  nome: string
  cognome: string
  email: string | null
  titoloProgetto: string | null
  supervisor: string | null
  cosupervisor: string | null
  biografia: Dottorando['biografia']
  abstract: Dottorando['abstract']
}

export async function importaDottorandiWp(payload: Payload) {
  const profili: DottorandoWp[] = JSON.parse(
    gunzipSync(readFileSync(path.join(dirname, 'dottorandi-wp.json.gz'))).toString('utf8'),
  )
  const esistenti = (
    await payload.find({ collection: 'dottorandi', pagination: false, depth: 0 })
  ).docs
  const perSlug = new Map(esistenti.map((d) => [d.slug, d]))

  let creati = 0
  let aggiornati = 0
  for (const p of profili) {
    try {
      const doc = perSlug.get(p.slugWp)
      const foto = path.join(dirname, 'foto-dottorandi', `${p.slugWp}.webp`)
      const caricaFoto = async () =>
        existsSync(foto)
          ? (
              await payload.create({
                collection: 'media',
                context: { importazione: true },
                data: { alt: `Ritratto di ${p.nome} ${p.cognome}` },
                filePath: foto,
              })
            ).id
          : undefined

      if (!doc) {
        await payload.create({
          collection: 'dottorandi',
          context: { importazione: true },
          data: {
            nome: p.nome,
            cognome: p.cognome,
            slug: p.slugWp,
            email: p.email ?? undefined,
            titoloProgetto: p.titoloProgetto ?? undefined,
            supervisor: p.supervisor ?? undefined,
            cosupervisor: p.cosupervisor ?? undefined,
            biografia: p.biografia ?? undefined,
            abstract: p.abstract ?? undefined,
            foto: await caricaFoto(),
          },
        })
        creati++
        continue
      }
      const data: Partial<Dottorando> = {}
      if (!doc.foto) {
        const id = await caricaFoto()
        if (id) data.foto = id
      }
      if (!doc.email && p.email) data.email = p.email
      if (!doc.titoloProgetto && p.titoloProgetto) data.titoloProgetto = p.titoloProgetto
      if (!doc.supervisor && p.supervisor) data.supervisor = p.supervisor
      if (!doc.cosupervisor && p.cosupervisor) data.cosupervisor = p.cosupervisor
      if (!doc.biografia && p.biografia) data.biografia = p.biografia
      if (!doc.abstract && p.abstract) data.abstract = p.abstract
      if (Object.keys(data).length === 0) continue
      await payload.update({
        collection: 'dottorandi',
        id: doc.id,
        context: { importazione: true },
        data,
      })
      aggiornati++
    } catch (e) {
      payload.logger.warn(`Dottorando WP ${p.wpId} non importato: ${(e as Error).message}`)
    }
  }

  // I profili erano stati importati come sottopagine: ora li mostra la collezione
  const vecchie = await payload.delete({
    collection: 'pagine',
    where: { percorso: { contains: `${PERCORSO_DOTTORANDI}/` } },
    context: { importazione: true },
  })
  const elenco = (
    await payload.find({
      collection: 'pagine',
      where: { percorso: { equals: PERCORSO_DOTTORANDI } },
      limit: 1,
      depth: 0,
    })
  ).docs[0]
  if (elenco && !elenco.sommario) {
    await payload.update({
      collection: 'pagine',
      id: elenco.id,
      context: { importazione: true },
      data: {
        sommario:
          'Chi sono i dottorandi del Dottorato di ricerca dell’Accademia Albertina e su cosa lavorano.',
      },
    })
  }

  if (creati || aggiornati || vecchie.docs.length) {
    payload.logger.info(
      `Dottorandi: ${creati} creati, ${aggiornati} aggiornati, ${vecchie.docs.length} vecchie pagine tolte.`,
    )
  }
}
