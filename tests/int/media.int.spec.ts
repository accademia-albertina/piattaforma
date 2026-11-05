// @vitest-environment node
import { getPayload, Payload } from 'payload'
import sharp from 'sharp'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import config from '@/payload.config'

let payload: Payload
const creati: number[] = []

describe('Caricamento immagini', () => {
  beforeAll(async () => {
    payload = await getPayload({ config: await config })
  })

  afterAll(async () => {
    for (const id of creati) await payload.delete({ collection: 'media', id })
  })

  it('converte in WebP, riduce a Full HD e scrive il testo alternativo', async () => {
    const png = await sharp({
      create: { width: 4000, height: 3000, channels: 3, background: '#a23130' },
    })
      .png()
      .toBuffer()
    const media = await payload.create({
      collection: 'media',
      data: {},
      file: { data: png, name: 'foto_mostra-finale.png', mimetype: 'image/png', size: png.length },
    })
    creati.push(media.id)
    expect(media.mimeType).toBe('image/webp')
    expect(media.filename).toMatch(/\.webp$/)
    expect(media.width).toBe(1920)
    expect(media.height).toBe(1440)
    // Nei test non c'è la chiave dell'API: il testo viene dal nome del file
    expect(media.alt).toBe(process.env.ANTHROPIC_API_KEY ? expect.any(String) : 'Foto mostra finale')
  })

  it('non ingrandisce le immagini piccole e lascia il testo scritto a mano', async () => {
    const jpg = await sharp({
      create: { width: 800, height: 600, channels: 3, background: '#203038' },
    })
      .jpeg()
      .toBuffer()
    const media = await payload.create({
      collection: 'media',
      data: { alt: 'Il cortile della sede' },
      file: { data: jpg, name: 'cortile.jpg', mimetype: 'image/jpeg', size: jpg.length },
    })
    creati.push(media.id)
    expect(media.width).toBe(800)
    expect(media.alt).toBe('Il cortile della sede')
  })
})
