export type PezzoTesto = { tipo: 'testo'; testo: string } | { tipo: 'link'; testo: string; href: string }

// Indirizzi web (con http/https o www.) ed email. La punteggiatura finale resta fuori dal link.
const LINK = /\b(?:https?:\/\/|www\.)[^\s<>"]*[^\s<>".,;:!?)\]'»]|[\w.+-]+@[\w-]+(?:\.[\w-]+)+/gi

/**
 * Divide un testo in pezzi di testo e link: serve per rendere cliccabili gli
 * indirizzi scritti a mano negli avvisi (moduli Google, Classroom, email).
 */
export function dividiLink(testo: string): PezzoTesto[] {
  const pezzi: PezzoTesto[] = []
  let ultimo = 0
  for (const m of testo.matchAll(LINK)) {
    const inizio = m.index ?? 0
    if (inizio > ultimo) pezzi.push({ tipo: 'testo', testo: testo.slice(ultimo, inizio) })
    const url = m[0]
    const href = url.includes('@') && !/^https?:|^www\./i.test(url)
      ? `mailto:${url}`
      : /^www\./i.test(url)
        ? `https://${url}`
        : url
    pezzi.push({ tipo: 'link', testo: url, href })
    ultimo = inizio + url.length
  }
  if (ultimo < testo.length) pezzi.push({ tipo: 'testo', testo: testo.slice(ultimo) })
  return pezzi
}

/** Toglie gli indirizzi da un testo (per sommari e anteprime nelle card). */
export function senzaLink(testo: string): string {
  return testo
    .replace(LINK, ' ')
    .replace(/\s+([:,.;])/g, '$1')
    .replace(/\s+/g, ' ')
    .replace(/[\s:]+$/, '')
    .trim()
}
