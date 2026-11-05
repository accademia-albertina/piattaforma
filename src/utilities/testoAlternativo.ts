/**
 * Testo alternativo automatico per le immagini caricate nel pannello: chi carica non deve scriverlo.
 * Si ricava dal nome del file, senza servizi esterni né costi; resta modificabile nel pannello.
 */

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
