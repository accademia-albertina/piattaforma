// @vitest-environment node
import fs from 'node:fs/promises'
import path from 'node:path'

import { getPayload, type Payload } from 'payload'
import sharp from 'sharp'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import config from '@/payload.config'
import { cartellaLocale } from '@/lib/drive/adattatore'
import {
  attendiSincronizzazione,
  avviaSincronizzazione,
  statoSincronizzazione,
} from '@/lib/wp-import/sincronizza'

let payload: Payload
const WP = 'https://albertina-academy.it/wp-content/uploads'
const ENV = ['GOOGLE_DRIVE_CLIENT_ID', 'GOOGLE_DRIVE_CLIENT_SECRET', 'DRIVE_ID']
let png: Buffer

/** Finto WordPress: due file nell'elenco REST e i rispettivi download. */
const media = [
  {
    id: 101,
    modified_gmt: '2026-11-01T10:00:00',
    source_url: `${WP}/2026/07/bando-prova-wp.pdf`,
    mime_type: 'application/pdf',
    alt_text: '',
    title: { rendered: 'Bando &#8211; prova' },
  },
  {
    id: 102,
    modified_gmt: '2026-11-01T10:00:00',
    source_url: `${WP}/2024/05/foto-prova-wp-scaled.png`,
    mime_type: 'image/png',
    alt_text: 'Scalone',
    title: { rendered: 'foto' },
  },
]
const scaricati: string[] = []

async function fintoWp(input: RequestInfo | URL) {
  const url = String(input)
  if (url.includes('/wp-json/wp/v2/media')) {
    return new Response(JSON.stringify(media), {
      headers: { 'content-type': 'application/json', 'x-wp-total': '2', 'x-wp-totalpages': '1' },
    })
  }
  scaricati.push(url)
  if (url.endsWith('.pdf')) return new Response('%PDF-1.4 prova')
  if (url.endsWith('.png')) return new Response(new Uint8Array(png))
  return new Response('no', { status: 404 })
}

const pulisci = async () => {
  await payload.delete({ collection: 'albo', where: { titolo: { like: 'Prova import WP' } } })
  await payload.delete({ collection: 'media', where: { wpId: { exists: true } } })
}

describe('Importazione dei file da WordPress', () => {
  const salvati: Record<string, string | undefined> = {}

  beforeAll(async () => {
    for (const k of ENV) salvati[k] = process.env[k]
    for (const k of ENV) delete process.env[k]
    payload = await getPayload({ config: await config })
    png = await sharp({
      create: { width: 40, height: 30, channels: 3, background: '#a23130' },
    })
      .png()
      .toBuffer()
    await pulisci()
  })

  afterAll(async () => {
    await pulisci()
    for (const k of ENV) {
      if (salvati[k] === undefined) delete process.env[k]
      else process.env[k] = salvati[k]
    }
  })

  it('importa i file, ricorda l’ID WordPress e riscrive i link', async () => {
    const atto = await payload.create({
      collection: 'albo',
      data: {
        titolo: 'Prova import WP',
        sezione: 'bandi-generici',
        categoria: 'Bandi per studenti',
        pubblicatoIl: new Date().toISOString(),
        documenti: [
          { nome: 'Bando', url: `${WP}/2026/07/bando-prova-wp.pdf` },
          { nome: 'Rotto', url: `${WP}/2024/12/rotto-prova-wp.pdfdf` },
        ],
        _status: 'published',
      },
      overrideAccess: true,
    })

    expect(avviaSincronizzazione(payload, { fetch: fintoWp as typeof fetch })).toBe(true)
    await attendiSincronizzazione()
    const s = statoSincronizzazione()
    expect(s.errori).toEqual([])
    expect(s.nuovi).toBe(2)
    expect(s.linkNonTrovatiTotale).toBeGreaterThan(0)

    const { docs } = await payload.find({
      collection: 'media',
      where: { wpId: { exists: true } },
      sort: 'wpId',
      overrideAccess: true,
    })
    expect(docs.map((d) => [d.wpId, d.filename, d.mimeType])).toEqual([
      [101, 'bando-prova-wp.pdf', 'application/pdf'],
      [102, 'foto-prova-wp-scaled.png', 'image/png'],
    ])
    expect(docs[0].alt).toBe('Bando – prova')
    expect([docs[1].width, docs[1].height, docs[1].alt]).toEqual([40, 30, 'Scalone'])
    // Senza Drive il file resta sul disco del server, servito da Payload come gli altri
    expect(
      await fs.readFile(
        path.join(cartellaLocale(payload.collections.media.config), 'bando-prova-wp.pdf'),
        'utf8',
      ),
    ).toBe('%PDF-1.4 prova')

    const dopo = await payload.findByID({ collection: 'albo', id: atto.id, depth: 0 })
    const [bando, rotto] = dopo.documenti ?? []
    expect(bando.file).toBe(docs[0].id)
    expect(bando.url).toBeFalsy()
    expect(rotto.url).toBe(`${WP}/2024/12/rotto-prova-wp.pdfdf`)
  })

  it('rilanciata, prende solo i file modificati su WordPress', async () => {
    scaricati.length = 0
    avviaSincronizzazione(payload, { fetch: fintoWp as typeof fetch })
    await attendiSincronizzazione()
    expect(statoSincronizzazione().invariati).toBe(2)
    expect(scaricati).toEqual([])

    media[0].modified_gmt = '2026-11-20T09:00:00'
    avviaSincronizzazione(payload, { fetch: fintoWp as typeof fetch })
    await attendiSincronizzazione()
    const s = statoSincronizzazione()
    expect([s.nuovi, s.aggiornati, s.invariati]).toEqual([0, 1, 1])
    expect(scaricati).toEqual([`${WP}/2026/07/bando-prova-wp.pdf`])
    const { totalDocs } = await payload.count({
      collection: 'media',
      where: { wpId: { exists: true } },
    })
    expect(totalDocs).toBe(2)
  })
})
