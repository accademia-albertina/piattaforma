type Nodo = { text?: unknown; children?: unknown }

const MAX = 80

/** Testo semplice di un campo rich text Lexical (solo i primi caratteri servono). */
export function testoLexical(valore: unknown): string {
  const parti: string[] = []
  const visita = (nodo: Nodo) => {
    if (parti.join(' ').length > MAX) return
    if (typeof nodo.text === 'string') parti.push(nodo.text)
    if (Array.isArray(nodo.children)) nodo.children.forEach((figlio) => visita(figlio as Nodo))
  }
  const radice = (valore as { root?: Nodo } | null | undefined)?.root
  if (radice) visita(radice)
  return parti.join(' ').replace(/\s+/g, ' ').trim()
}

const accorcia = (testo: string) =>
  testo.length > MAX ? `${testo.slice(0, MAX - 1).trimEnd()}…` : testo

/**
 * Riassunto di un blocco per la sua intestazione nel pannello:
 * titolo della sezione, poi didascalia, poi inizio del testo, poi numero di voci.
 */
export function riassuntoBlocco(dati: Record<string, unknown> | undefined): string {
  if (!dati) return ''
  for (const campo of ['titolo', 'didascalia']) {
    const valore = dati[campo]
    if (typeof valore === 'string' && valore.trim()) return accorcia(valore.trim())
  }
  const testo = testoLexical(dati.testo)
  if (testo) return accorcia(testo)
  for (const [campo, uno, tanti] of [
    ['voci', 'voce', 'voci'],
    ['immagini', 'immagine', 'immagini'],
    ['documenti', 'documento', 'documenti'],
  ] as const) {
    const righe = dati[campo]
    if (Array.isArray(righe) && righe.length) {
      return `${righe.length} ${righe.length === 1 ? uno : tanti}`
    }
  }
  return ''
}
