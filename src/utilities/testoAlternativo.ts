/**
 * Testo alternativo automatico per le immagini caricate nel pannello: chi carica non deve scriverlo.
 * Con ANTHROPIC_API_KEY lo descrive Claude guardando l'immagine; senza chiave (o se la chiamata
 * non riesce) si ricava dal nome del file. Resta modificabile nel pannello.
 */
import Anthropic from '@anthropic-ai/sdk'
import type { SharpDependency } from 'payload'

const MODELLO = 'claude-opus-5-5'

const ISTRUZIONI = `Scrivi il testo alternativo (attributo alt) di un'immagine pubblicata sul sito dell'Accademia Albertina di Belle Arti di Torino.
Regole:
- italiano, una sola frase, al massimo 125 caratteri, senza punto finale;
- descrivi ciò che si vede e conta per chi non vede l'immagine: soggetto, azione, luogo se riconoscibile;
- non iniziare con "Immagine di", "Foto di" o simili;
- se contiene testo leggibile importante (titolo di un evento, date), riportalo;
- non inventare nomi di persone o di opere che non sono scritti nell'immagine.
Rispondi solo con il testo alternativo.`

/** Dal nome del file: "Locandina_Open-Day 2026.jpg" → "Locandina open day 2026". */
export function altDaNomeFile(nome: string): string {
  const base = nome
    .replace(/\.[a-z0-9]+$/i, '')
    .replace(/[-_]+/g, ' ')
    .replace(/\s*\b(scaled|copy|copia|\d+x\d+)\b\s*/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  if (!base) return 'Immagine'
  return base.charAt(0).toUpperCase() + base.slice(1).toLowerCase()
}

/** Ripulisce la risposta del modello: niente virgolette, a capo o punto finale; massimo 160 caratteri. */
export function pulisciAlt(testo: string): string {
  const t = testo
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^["“'«]+|["”'»]+$/g, '')
    .trim()
    .replace(/\.$/, '')
  return t.length > 160 ? `${t.slice(0, 159).replace(/\s+\S*$/, '')}…` : t
}

export async function generaAlt({
  dati,
  nomeFile,
  sharp,
}: {
  dati: Buffer
  nomeFile: string
  sharp?: SharpDependency
}): Promise<string> {
  const ripiego = altDaNomeFile(nomeFile)
  if (!process.env.ANTHROPIC_API_KEY || !sharp) return ripiego
  try {
    // Una copia piccola basta per descrivere l'immagine e costa meno
    const anteprima = await sharp(dati)
      .rotate()
      .resize(1024, 1024, { fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 80 })
      .toBuffer()
    const client = new Anthropic({ timeout: 30_000, maxRetries: 1 })
    const risposta = await client.beta.messages.create({
      model: MODELLO,
      max_tokens: 2000,
      output_config: { effort: 'low' },
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',
      system: ISTRUZIONI,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: 'image/jpeg',
                data: anteprima.toString('base64'),
              },
            },
            { type: 'text', text: `Nome del file: ${nomeFile}` },
          ],
        },
      ],
    })
    if (risposta.stop_reason === 'refusal') return ripiego
    const testo = risposta.content
      .flatMap((b) => (b.type === 'text' ? [b.text] : []))
      .join(' ')
    return pulisciAlt(testo) || ripiego
  } catch (e) {
    if (e instanceof Anthropic.APIError) {
      console.warn(`Testo alternativo automatico non riuscito (${e.status}): ${e.message}`)
    } else {
      console.warn(`Testo alternativo automatico non riuscito: ${(e as Error).message}`)
    }
    return ripiego
  }
}
