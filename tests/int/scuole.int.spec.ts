import { getPayload, Payload } from 'payload'
import config from '@/payload.config'

import { beforeAll, describe, expect, it } from 'vitest'

import { importaContenutiScuole } from '@/seed/scuole-contenuti'

let payload: Payload

const scuola = async (slug: string) =>
  (
    await payload.find({
      collection: 'scuole',
      where: { slug: { equals: slug } },
      depth: 0,
      overrideAccess: true,
    })
  ).docs[0]

describe('Pagine delle scuole', () => {
  beforeAll(async () => {
    payload = await getPayload({ config: await config })
    for (const [slug, nome] of [
      ['pittura', 'Pittura'],
      ['cinema-fotografia-e-audiovisivo', 'Cinema, fotografia e audiovisivo'],
    ]) {
      const s = await scuola(slug)
      if (s) {
        await payload.update({
          collection: 'scuole',
          id: s.id,
          data: { triennio: { sezioni: [] }, biennio: { sezioni: [] }, video: null },
          overrideAccess: true,
        })
      } else {
        await payload.create({ collection: 'scuole', data: { nome, slug }, overrideAccess: true })
      }
    }
  })

  it('importa i percorsi del sito attuale; Cinema non ha il biennio', async () => {
    await importaContenutiScuole(payload)
    const pittura = await scuola('pittura')
    expect(pittura.triennio?.sezioni?.length).toBeGreaterThan(0)
    expect(pittura.biennio?.attivo).toBe(true)
    expect(pittura.video).toMatch(/youtu/)
    const cinema = await scuola('cinema-fotografia-e-audiovisivo')
    expect(cinema.triennio?.sezioni?.length).toBeGreaterThan(0)
    expect(cinema.biennio?.attivo).toBe(false)
    expect(cinema.video).toBeFalsy()
  })

  it('non sovrascrive quanto modificato nel pannello', async () => {
    const pittura = await scuola('pittura')
    await payload.update({
      collection: 'scuole',
      id: pittura.id,
      data: { video: 'https://youtu.be/dQw4w9WgXcQ' },
      overrideAccess: true,
    })
    await importaContenutiScuole(payload)
    expect((await scuola('pittura')).video).toBe('https://youtu.be/dQw4w9WgXcQ')
  })

  it('accetta solo video di YouTube', async () => {
    const pittura = await scuola('pittura')
    await expect(
      payload.update({
        collection: 'scuole',
        id: pittura.id,
        data: { video: 'https://example.com/video.mp4' },
        overrideAccess: true,
      }),
    ).rejects.toThrow()
  })
})
