/** Pulizia dell'HTML di WordPress prima della conversione in Lexical. */
// Gli URL dei file puntano ancora al vecchio dominio di sviluppo del sito WP
export const dominio = (s: string) =>
  s.replace(/https?:\/\/(www\.)?newalbertina\.eu/g, 'https://albertina-academy.it')

/** Toglie i commenti HTML ripetendo finché non ne restano (un solo passaggio non basta per CodeQL). */
function senzaCommenti(html: string) {
  let prima: string
  do {
    prima = html
    html = html.replace(/<!--[\s\S]*?-->/g, '')
  } while (html !== prima)
  return html.replace(/<!--|-->/g, '')
}

export function pulisci(html: string) {
  return (
    senzaCommenti(dominio(html)) // commenti dei blocchi Gutenberg
      // Le immagini nel testo richiedono i file nella libreria media: per l'anteprima si tolgono
      .replace(/<figure[^>]*>[\s\S]*?<\/figure>/g, '')
      .replace(/<img[^>]*>/g, '')
      .replace(/<p>(\s|&nbsp;|<br\s*\/?>)*<\/p>/g, '') // paragrafi vuoti
      .replace(/ /g, ' ')
      .trim()
  )
}

/** "2026-10-21 15:12:26" (ora di Roma, senza fuso) → ISO in UTC, con l'ora legale giusta. */
export function daRoma(locale: string) {
  const comeUtc = new Date(`${locale.replace(' ', 'T')}Z`)
  const roma = new Date(comeUtc.toLocaleString('en-US', { timeZone: 'Europe/Rome' }))
  const utc = new Date(comeUtc.toLocaleString('en-US', { timeZone: 'UTC' }))
  return new Date(comeUtc.getTime() - (roma.getTime() - utc.getTime())).toISOString()
}

export const escape = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

export type Nodo = { type?: string; children?: Nodo[]; fields?: { url?: string } }

/** Corregge i link scritti male nel sito attuale; quelli senza destinazione diventano testo. */
export function correggiLink(n: Nodo): Nodo[] {
  const figli = n.children?.flatMap(correggiLink)
  if (figli) n.children = figli
  if (n.type !== 'link' || !n.fields) return [n]
  // Alcuni link hanno testo incollato dopo l'indirizzo: si tiene solo la prima parola
  let url = (n.fields.url ?? '').trim().split(/\s+/)[0] ?? ''
  if (/^h?ttps?:\/\//.test(url) || /^hhttps?:\/\//.test(url)) url = url.replace(/^h*ttp/, 'http')
  else if (/^[\w.+-]+@[\w-]+(\.[\w-]+)+$/.test(url)) url = `mailto:${url}`
  else if (url.startsWith('/')) url = `https://albertina-academy.it${url}`
  if (!/^(https?:\/\/|mailto:|tel:)/.test(url)) return n.children ?? []
  n.fields.url = url
  return [n]
}
