// @vitest-environment node
import { getPayload, type Payload } from 'payload'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import config from '@/payload.config'
import {
  attendiSincronizzazioneContenuti,
  avviaSincronizzazioneContenuti,
  statoContenuti,
} from '@/lib/wp-import/contenuti/sincronizza-contenuti'
import type { AttoAlbo, Avviso, Trasparenza, User } from '@/payload-types'

let payload: Payload
let admin: User
let redazione: User
const WP = 'https://albertina-academy.it/wp-content/uploads'
const ENV = ['GOOGLE_DRIVE_CLIENT_ID', 'GOOGLE_DRIVE_CLIENT_SECRET', 'DRIVE_ID']

// --- Finto WordPress -------------------------------------------------------------------------

const mediaWp = [
  { id: 9101, url: `${WP}/2026/11/prova-sync-bando.pdf` },
  { id: 9102, url: `${WP}/2026/11/prova-sync-allegato.pdf` },
  { id: 9103, url: `${WP}/2026/11/prova-sync-bilancio.pdf` },
  { id: 9104, url: `${WP}/2026/11/prova-sync-sciopero.pdf` },
]

const wp = {
  atti: [
    {
      titolo: 'Prova sync WP – sciopero del 20 novembre',
      file: `${WP}/2026/11/prova-sync-sciopero.pdf`,
    },
    { titolo: 'Prova sync WP – assemblea', file: `${WP}/2026/11/prova-sync-bando.pdf` },
  ],
  avviso: {
    id: 99001,
    date_gmt: '2026-11-14T09:00:00',
    modified_gmt: '2026-11-14T09:00:00',
    slug: 'prova-sync-wp-avviso',
    title: { rendered: 'Prova sync WP avviso' },
    content: {
      rendered: '<!-- wp:paragraph --><p>Testo dell&#8217;avviso.</p><!-- /wp:paragraph -->',
    },
    categories: [4],
    tags: [],
    featured_media: 0,
    acf: { nome_allegato: 'Bando di prova', documento: 9102, documento_2: '' },
  },
  voce: {
    id: 99002,
    modified: '2026-11-14T10:00:00',
    modified_gmt: '2026-11-14T09:00:00',
    slug: 'prova-sync-wp-trasparenza',
    title: { rendered: 'Prova sync WP trasparenza' },
    'amministrazione-trasparente': [500],
    acf: {
      documenti_da_allegare: [
        {
          testo: '',
          nome_documento: 'Bilancio 2026',
          documento: 9103,
          ti_occorre_inserire_un_link: 'No',
        },
        {
          testo: '',
          nome_documento: '',
          documento: false,
          ti_occorre_inserire_un_link: 'Si',
          nome_del_link: 'Portale PA',
          link: 'https://www.example.org/pa',
        },
      ],
    },
  },
}

const paginaAlbo = () => `
<div class="bde-accordion">
  <h2><button><span class="bde-accordion__title">Prova sync categoria</span></button></h2>
  ${wp.atti
    .map(
      (a) => `<div class="bde-rich-text"><p>${a.titolo}</p></div>
  <div class="bde-icon-list"><ul><li><a href="${a.file}"><span class="bde-icon-list__text">Documento</span></a></li></ul></div>`,
    )
    .join('')}
</div>`

const json = (dati: unknown) =>
  new Response(JSON.stringify(dati), {
    headers: { 'content-type': 'application/json', 'x-wp-totalpages': '1' },
  })

const restMedia = (m: (typeof mediaWp)[number]) => ({
  id: m.id,
  modified_gmt: '2026-11-14T09:00:00',
  source_url: m.url,
  mime_type: 'application/pdf',
  alt_text: '',
  title: { rendered: m.url.split('/').pop() },
})

async function fintoWp(input: RequestInfo | URL) {
  const url = new URL(String(input))
  const p = url.pathname.replace('/wp-json/wp/v2/', '')
  const campi = url.searchParams.get('_fields') ?? ''
  if (p === 'albo')
    return json([{ id: 5015, modified_gmt: 'x', content: { rendered: paginaAlbo() } }])
  if (p === 'avviso') {
    if (campi === 'id,modified_gmt,slug')
      return json([wp.avviso].map(({ id, modified_gmt, slug }) => ({ id, modified_gmt, slug })))
    return json([wp.avviso])
  }
  if (p === 'amm-trasparente') {
    if (campi === 'id,modified_gmt,slug')
      return json([wp.voce].map(({ id, modified_gmt, slug }) => ({ id, modified_gmt, slug })))
    return json([wp.voce])
  }
  if (p === 'categories') return json([{ id: 4, name: 'Generali' }])
  if (p === 'tags') return json([])
  if (p === 'amministrazione-trasparente') return json([{ id: 500, name: 'Bilanci' }])
  if (p === 'pages') return json([])
  if (p === 'media') return json(mediaWp.map(restMedia))
  const m = /^media\/(\d+)$/.exec(p)
  if (m) {
    const media = mediaWp.find((x) => x.id === Number(m[1]))
    return media ? json(restMedia(media)) : new Response('no', { status: 404 })
  }
  if (url.pathname.startsWith('/wp-content/uploads/')) return new Response('%PDF-1.4 prova')
  return new Response('no', { status: 404 })
}

const sincronizza = async () => {
  expect(avviaSincronizzazioneContenuti(payload, { fetch: fintoWp as typeof fetch })).toBe(true)
  await attendiSincronizzazioneContenuti()
  return statoContenuti()
}

type Tipi = { albo: AttoAlbo; avvisi: Avviso; trasparenza: Trasparenza }
const trova = async <C extends keyof Tipi>(collection: C, titolo: string) =>
  (
    await payload.find({
      collection,
      where: { titolo: { like: titolo } },
      depth: 0,
      draft: true,
      overrideAccess: true,
    })
  ).docs as unknown as Tipi[C][]

const pulisci = async () => {
  for (const collection of ['albo', 'avvisi', 'trasparenza'] as const)
    await payload.delete({
      collection,
      where: { titolo: { like: 'Prova sync WP' } },
      overrideAccess: true,
    })
  await payload.delete({
    collection: 'media',
    where: { wpId: { in: mediaWp.map((m) => m.id) } },
    overrideAccess: true,
  })
  await payload.delete({ collection: 'users', where: { email: { like: '.syncwp@' } } })
}

describe('Sincronizzazione dei contenuti da WordPress', () => {
  const salvati: Record<string, string | undefined> = {}

  beforeAll(async () => {
    for (const k of ENV) salvati[k] = process.env[k]
    for (const k of ENV) delete process.env[k]
    payload = await getPayload({ config: await config })
    await pulisci()
    admin = await payload.create({
      collection: 'users',
      data: {
        email: 'admin.syncwp@albertina.academy',
        password: 'Prova-sync-WP-2026!',
        roles: ['admin'],
      },
    })
    redazione = await payload.create({
      collection: 'users',
      data: {
        email: 'redazione.syncwp@albertina.academy',
        password: 'Prova-sync-WP-2026!',
        roles: ['redazione'],
      },
    })
  }, 60_000)

  afterAll(async () => {
    await pulisci()
    for (const k of ENV) {
      if (salvati[k] === undefined) delete process.env[k]
      else process.env[k] = salvati[k]
    }
  })

  it('crea i contenuti nuovi con i file importati da WordPress', async () => {
    const s = await sincronizza()
    expect(s.albo.errori).toEqual([])
    expect(s.trasparenza.errori).toEqual([])
    expect(s.avvisi.errori).toEqual([])

    const [atto] = await trova('albo', 'Prova sync WP – sciopero')
    expect(atto).toMatchObject({
      sezione: 'sindacale',
      categoria: 'Prova sync categoria',
      _status: 'published',
      modificatoNelPannello: false,
    })
    expect(atto.wpId).toMatch(/^albo:/)
    expect(atto.documenti?.[0]).toMatchObject({ nome: 'Documento', url: null })
    expect(typeof atto.documenti?.[0].file).toBe('number')

    const [avviso] = await trova('avvisi', 'Prova sync WP avviso')
    expect(avviso).toMatchObject({
      wpId: '99001',
      categorie: ['generali'],
      slug: 'prova-sync-wp-avviso',
    })
    expect(avviso.allegati?.[0]).toMatchObject({ nome: 'Bando di prova' })
    expect(JSON.stringify(avviso.contenuto)).toContain('Testo dell’avviso.')

    const [voce] = await trova('trasparenza', 'Prova sync WP trasparenza')
    expect(voce.sezione).toBe('Bilanci')
    expect(voce.documenti?.map((d) => [d.nome, typeof d.file, d.url ?? null])).toEqual([
      ['Bilancio 2026', 'number', null],
      ['Portale PA', 'object', 'https://www.example.org/pa'],
    ])
  })

  it('salta gli invariati e aggiorna i modificati su WordPress', async () => {
    let s = await sincronizza()
    expect(s.avvisi.nuovi + s.avvisi.aggiornati).toBe(0)
    expect(s.trasparenza.nuovi + s.trasparenza.aggiornati).toBe(0)

    wp.voce = {
      ...wp.voce,
      modified_gmt: '2026-11-14T11:00:00',
      title: { rendered: 'Prova sync WP trasparenza rivista' },
    }
    s = await sincronizza()
    expect(s.trasparenza.aggiornati).toBe(1)
    expect(await trova('trasparenza', 'Prova sync WP trasparenza rivista')).toHaveLength(1)
  })

  it('non sovrascrive un contenuto modificato nel pannello e lo segnala', async () => {
    const [avviso] = await trova('avvisi', 'Prova sync WP avviso')
    const modificato = await payload.update({
      collection: 'avvisi',
      id: avviso.id,
      data: { titolo: 'Prova sync WP avviso corretto in redazione' },
      user: redazione,
      overrideAccess: false,
    })
    expect(modificato.modificatoNelPannello).toBe(true)
    expect(modificato.wpId).toBe('99001')

    wp.avviso = {
      ...wp.avviso,
      modified_gmt: '2026-11-14T12:00:00',
      title: { rendered: 'Prova sync WP avviso da WordPress' },
    }
    const s = await sincronizza()
    expect(s.avvisi.aggiornati).toBe(0)
    expect(s.avvisi.daControllare.join()).toContain('corretto in redazione')
    expect(await trova('avvisi', 'corretto in redazione')).toHaveLength(1)
  })

  it('chi non è admin non può togliere la spunta né cambiare l’ID WordPress', async () => {
    const [avviso] = await trova('avvisi', 'corretto in redazione')
    const r = await payload.update({
      collection: 'avvisi',
      id: avviso.id,
      data: { modificatoNelPannello: false, wpId: '1' },
      user: redazione,
      overrideAccess: false,
    })
    expect(r).toMatchObject({ modificatoNelPannello: true, wpId: '99001' })
  })

  it('togliendo la spunta (admin) torna la versione di WordPress', async () => {
    const [avviso] = await trova('avvisi', 'corretto in redazione')
    await payload.update({
      collection: 'avvisi',
      id: avviso.id,
      data: { modificatoNelPannello: false },
      user: admin,
      overrideAccess: false,
    })
    const s = await sincronizza()
    expect(s.avvisi.aggiornati).toBe(1)
    expect(await trova('avvisi', 'Prova sync WP avviso da WordPress')).toHaveLength(1)
  })

  it('un atto tolto da WordPress resta e viene segnalato', async () => {
    wp.atti = wp.atti.slice(0, 1)
    const s = await sincronizza()
    expect(s.albo.nonPiuSuWp.join()).toContain('Prova sync WP – assemblea')
    expect(await trova('albo', 'Prova sync WP – assemblea')).toHaveLength(1)
  })
})
