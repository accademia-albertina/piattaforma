/**
 * Cifratura del refresh token di Google Drive salvato nel database (AES-256-GCM).
 * La chiave deriva da PAYLOAD_SECRET: chi legge il database non può usare il token.
 * Se PAYLOAD_SECRET cambia il token non si decifra più e Drive va ricollegato dal pannello.
 */
import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto'

const chiave = () => {
  const segreto = process.env.PAYLOAD_SECRET
  if (!segreto) throw new Error('PAYLOAD_SECRET mancante: impossibile cifrare il token di Drive')
  return createHash('sha256').update(`google-drive:${segreto}`).digest()
}

/** Testo cifrato nel formato v1.<iv>.<tag>.<dati>, tutto in base64url. */
export function cifra(testo: string): string {
  const iv = randomBytes(12)
  const c = createCipheriv('aes-256-gcm', chiave(), iv)
  const dati = Buffer.concat([c.update(testo, 'utf8'), c.final()])
  return ['v1', iv, c.getAuthTag(), dati]
    .map((p) => (typeof p === 'string' ? p : p.toString('base64url')))
    .join('.')
}

/** Restituisce null se il testo è stato alterato o cifrato con un'altra chiave. */
export function decifra(cifrato: string): string | null {
  const [versione, iv, tag, dati] = cifrato.split('.')
  if (versione !== 'v1' || !iv || !tag || !dati) return null
  try {
    const d = createDecipheriv('aes-256-gcm', chiave(), Buffer.from(iv, 'base64url'))
    d.setAuthTag(Buffer.from(tag, 'base64url'))
    return Buffer.concat([d.update(Buffer.from(dati, 'base64url')), d.final()]).toString('utf8')
  } catch {
    return null
  }
}
