// @vitest-environment node
import { NextRequest } from 'next/server'
import { afterEach, describe, expect, it, vi } from 'vitest'

async function proxyCon(password?: string) {
  vi.resetModules()
  vi.stubEnv('ANTEPRIMA_PASSWORD', password ?? '')
  return (await import('@/proxy')).proxy
}

const richiesta = (credenziali?: string) =>
  new NextRequest('http://localhost:3000/avvisi', {
    headers: credenziali ? { authorization: `Basic ${btoa(credenziali)}` } : {},
  })

afterEach(() => vi.unstubAllEnvs())

describe('anteprima protetta da password', () => {
  it('senza ANTEPRIMA_PASSWORD il sito è aperto', async () => {
    const proxy = await proxyCon()
    expect(proxy(richiesta()).status).toBe(200)
  })

  it('chiede le credenziali e rifiuta quelle sbagliate', async () => {
    const proxy = await proxyCon('segreta')
    const senza = proxy(richiesta())
    expect(senza.status).toBe(401)
    expect(senza.headers.get('www-authenticate')).toContain('Basic')
    expect(proxy(richiesta('albertina:sbagliata')).status).toBe(401)
    expect(proxy(richiesta('altro:segreta')).status).toBe(401)
  })

  it('con le credenziali giuste lascia passare senza indicizzare', async () => {
    const proxy = await proxyCon('segreta')
    const res = proxy(richiesta('albertina:segreta'))
    expect(res.status).toBe(200)
    expect(res.headers.get('x-robots-tag')).toContain('noindex')
  })
})

describe('percorsi esclusi dalla password', () => {
  it('lascia fuori immagini, icone e file media, ma protegge pagine e pannello', async () => {
    const { config } = await import('@/proxy')
    const re = new RegExp(`^${config.matcher[0]}$`)
    for (const libero of [
      '/_next/image',
      '/_next/static/media/pittura.webp',
      '/api/media/file/ritratto.webp',
      '/apple-touch-icon.png',
      '/salute',
    ]) {
      expect(re.test(libero), libero).toBe(false)
    }
    for (const protetto of ['/', '/avvisi', '/admin', '/api/users/me']) {
      expect(re.test(protetto), protetto).toBe(true)
    }
  })
})
