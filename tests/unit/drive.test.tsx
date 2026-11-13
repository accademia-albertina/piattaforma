import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'

import { render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import PannelloDrive, { type PropsPannelloDrive } from '@/components/admin/PannelloDrive'
import { clientDrive, urlAutorizzazioneDrive } from '@/lib/drive/api'
import { fileInCache, pulisciCache } from '@/lib/drive/cache'
import { cifra, decifra } from '@/lib/drive/cifratura'

import { axeViolations } from './axe'

const base: PropsPannelloDrive = {
  account: 'noreply@albertina.academy',
  configurato: true,
  mancanti: [],
  collegato: false,
  idCartella: 'cartella123',
  cartella: {},
  suDisco: 3,
  spostamento: { inCorso: false, totale: 0, spostati: 0, mancanti: [], errori: [] },
}

describe('Cifratura del token di Drive', () => {
  it('decifra ciò che cifra e rifiuta testi alterati', () => {
    const c = cifra('1//refresh-token-segreto')
    expect(c).not.toContain('refresh')
    expect(decifra(c)).toBe('1//refresh-token-segreto')
    const parti = c.split('.')
    parti[3] = Buffer.from('altro').toString('base64url')
    expect(decifra(parti.join('.'))).toBeNull()
    expect(decifra('testo-qualsiasi')).toBeNull()
  })
})

describe('Autorizzazione Google Drive', () => {
  it('chiede Drive offline per noreply@ con PKCE', () => {
    process.env.GOOGLE_DRIVE_CLIENT_ID = 'client-drive'
    const url = new URL(
      urlAutorizzazioneDrive({
        stato: 's',
        verificatore: 'v'.repeat(64),
        redirectUri: 'https://x/cb',
      }),
    )
    const q = url.searchParams
    expect(q.get('client_id')).toBe('client-drive')
    expect(q.get('scope')).toBe('openid email https://www.googleapis.com/auth/drive')
    expect(q.get('access_type')).toBe('offline')
    expect(q.get('prompt')).toContain('consent')
    expect(q.get('login_hint')).toBe('noreply@albertina.academy')
    expect(q.get('code_challenge_method')).toBe('S256')
    expect(q.get('code_challenge')).not.toBe('v'.repeat(64))
  })
})

describe('Caricamento su Drive a blocchi', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('legge dal disco 8 MB alla volta e manda i blocchi in ordine', async () => {
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'carica-drive-'))
    const p = path.join(dir, 'grande.pdf')
    const MB = 1024 * 1024
    await fs.writeFile(p, Buffer.alloc(20 * MB, 1))
    const intervalli: (string | null)[] = []
    const dimensioni: number[] = []
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string, init: RequestInit) => {
        if (url.includes('uploadType=resumable')) {
          return new Response(null, { headers: { location: 'https://upload.prova/s' } })
        }
        const h = new Headers(init.headers)
        intervalli.push(h.get('content-range'))
        dimensioni.push((init.body as Uint8Array).byteLength)
        return intervalli.length < 3
          ? new Response(null, { status: 308 })
          : Response.json({ id: 'file-grande' })
      }),
    )
    const drive = clientDrive(async () => 'token')
    const id = await drive.carica({
      nome: 'grande.pdf',
      mimeType: 'application/pdf',
      dati: p,
      padre: 'c',
    })
    expect(id).toBe('file-grande')
    expect(intervalli).toEqual([
      `bytes 0-${8 * MB - 1}/${20 * MB}`,
      `bytes ${8 * MB}-${16 * MB - 1}/${20 * MB}`,
      `bytes ${16 * MB}-${20 * MB - 1}/${20 * MB}`,
    ])
    expect(dimensioni).toEqual([8 * MB, 8 * MB, 4 * MB])
    await fs.rm(dir, { recursive: true, force: true })
  })
})

describe('Cache dei file di Drive', () => {
  let dir: string
  beforeEach(async () => {
    dir = await fs.mkdtemp(path.join(os.tmpdir(), 'cache-drive-'))
    process.env.DRIVE_CACHE_DIR = dir
  })
  afterEach(async () => {
    delete process.env.DRIVE_CACHE_DIR
    await fs.rm(dir, { recursive: true, force: true })
  })

  it('scarica una volta sola, anche con richieste contemporanee', async () => {
    let chiamate = 0
    const scarica = async () => {
      chiamate++
      return new Response('contenuto del file')
    }
    const [a, b] = await Promise.all([fileInCache('abc_1', scarica), fileInCache('abc_1', scarica)])
    expect(a).toBe(b)
    await fileInCache('abc_1', scarica)
    expect(chiamate).toBe(1)
    expect(await fs.readFile(a, 'utf8')).toBe('contenuto del file')
  })

  it('rifiuta ID che sembrano percorsi', async () => {
    await expect(fileInCache('../etc', async () => new Response('x'))).rejects.toThrow()
  })

  it('oltre il limite toglie i file usati meno di recente', async () => {
    await fs.writeFile(path.join(dir, 'vecchio'), 'x'.repeat(100))
    await fs.utimes(path.join(dir, 'vecchio'), new Date(2020, 0, 1), new Date(2020, 0, 1))
    await fs.writeFile(path.join(dir, 'nuovo'), 'x'.repeat(100))
    await pulisciCache(150)
    expect(await fs.readdir(dir)).toEqual(['nuovo'])
  })
})

describe('Pagina Google Drive del pannello', () => {
  it('da collegare: pulsante, passi con l’account giusto e axe', async () => {
    const { container } = render(<PannelloDrive {...base} />)
    expect(screen.getByRole('link', { name: 'Collega Google Drive' }).getAttribute('href')).toBe(
      '/api/drive/oauth/avvia',
    )
    expect(screen.getByText('Non collegato')).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'Scollega' })).toBeNull()
    // Niente "Sposta su Drive" finché Drive non è collegato
    expect(screen.queryByRole('button', { name: 'Sposta su Drive' })).toBeNull()
    expect(await axeViolations(container)).toEqual([])
  })

  it('collegato: stato, cartella, scollega, sposta e axe', async () => {
    const { container } = render(
      <PannelloDrive
        {...base}
        collegato
        email="noreply@albertina.academy"
        collegatoIl="2026-11-13T11:05:00.000Z"
        collegatoDa="new@albertina.academy"
        cartella={{ nome: 'Sito Albertina – file', condiviso: false }}
        esito="collegato"
      />,
    )
    expect(screen.getByText('Attivo')).toBeTruthy()
    expect(screen.getByRole('status').textContent).toContain('Google Drive collegato')
    expect(screen.getByRole('link', { name: /Sito Albertina – file/ }).getAttribute('href')).toBe(
      'https://drive.google.com/drive/folders/cartella123',
    )
    expect(
      screen.getByRole('button', { name: 'Scollega' }).closest('form')?.getAttribute('action'),
    ).toBe('/api/drive/scollega')
    expect(screen.getByRole('button', { name: 'Sposta su Drive' })).toBeTruthy()
    expect(await axeViolations(container)).toEqual([])
  })

  it('spiega gli errori e cosa manca sul server', () => {
    render(<PannelloDrive {...base} errore="account" />)
    expect(screen.getByRole('alert').textContent).toContain('noreply@albertina.academy')
    render(<PannelloDrive {...base} configurato={false} mancanti={['DRIVE_ID']} />)
    expect(screen.getByText(/mancano: DRIVE_ID/)).toBeTruthy()
  })
})
