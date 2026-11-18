/**
 * Pagine istituzionali del sito attuale, lette dall'HTML che Breakdance genera e che l'API REST
 * pubblica restituisce in `content.rendered`.
 *
 * Stesse regole di scripts/wp/estrai-pagine.py (che leggeva l'albero Breakdance dal database
 * per l'importazione iniziale): titoli, testi, fisarmoniche, FAQ, schede, elenchi di link,
 * pulsanti, schede contatto e tabelle diventano blocchi; immagini, indici, contatori, moduli e
 * box "Scopri di più" verso le sottopagine si saltano (la piattaforma li mostra da sola).
 * I documenti PDF incorporati diventano un blocco Documento.
 */

import { conTestiPdf } from './testi-pdf'

/** ID WordPress → percorso nella nuova piattaforma. L'ordine conta: prima i genitori. */
export const PAGINE_WP: Record<number, string> = {
  1975: 'accademia',
  3477: 'accademia/storia-e-sedi',
  3491: 'accademia/ordinamento',
  3498: 'accademia/organigramma',
  8789: 'accademia/il-saluto-del-direttore',
  3508: 'accademia/biblioteca',
  13027: 'accademia/albertina-press',
  1973: 'didattica',
  3468: 'didattica/piani-di-studio',
  3569: 'didattica/manifesto-degli-studi',
  3731: 'didattica/trasferimenti',
  5114: 'didattica/ammissioni',
  5124: 'didattica/iscrizioni',
  1467: 'studente',
  45213: 'studente/matricole',
  972: 'studente/tesi',
  2188: 'studente/segreteria-didattica',
  3627: 'studente/tasse',
  3737: 'studente/stage-tirocinio',
  3742: 'studente/borse-di-studio',
  3745: 'studente/consulta',
  8192: 'studente/modulistica',
  8571: 'studente/sportelli',
  30894: 'studente/tutoraggio-interculturale',
  2209: 'dottorati',
  2586: 'dottorati/albertina',
  3463: 'dottorati/convenzionati',
  24397: 'dottorati/albertina/dottorandi',
  2212: 'erasmus',
  // Sul sito attuale sono di primo livello, ma il menu e la pagina Erasmus le cercano qui
  30951: 'erasmus/bandi',
  27593: 'erasmus/mobilita-studenti',
  27661: 'erasmus/mobilita-docenti-staff',
  27652: 'erasmus/incoming-students',
  1916: 'contatti',
  25402: 'open-data',
  5651: 'segnalazioni-di-accessibilita',
  3: 'privacy-policy',
  4952: 'cookie-policy',
  4971: 'termini-e-condizioni',
}

/** Indirizzi del sito attuale diventati sezioni della piattaforma (o spostati). */
const SPOSTATI: Record<string, string> = {
  'didattica/docenti': 'docenti',
  docenti: 'docenti',
  corsi: 'corsi',
  avvisi: 'avvisi',
  calendari: 'calendari',
  calendario: 'calendari',
  'didattica/segreteria': 'studente/segreteria-didattica',
  'studenti/consulta': 'studente/consulta',
  outgoing: 'erasmus/mobilita-studenti',
  incoming: 'erasmus/incoming-students',
  'docenti-e-staff': 'erasmus/mobilita-docenti-staff',
  'bandi-erasmus': 'erasmus/bandi',
  'studente/trasferimenti': 'didattica/trasferimenti',
  'didattica/ammissioni-e-iscrizioni': 'didattica/ammissioni',
}

export type BloccoGrezzo =
  | { tipo: 'testo'; html: string }
  | { tipo: 'fisarmonica'; voci: { titolo: string; html: string }[] }
  | { tipo: 'immagine'; url: string; didascalia?: string | null }
  | { tipo: 'planimetria' }
  | { tipo: 'guidaStudenti'; titolo?: string }
  | {
      tipo: 'galleria'
      immagini: { url: string; didascalia?: string | null }[]
      aspetto?: 'griglia' | 'fascia'
    }
  | { tipo: 'link'; voci: { etichetta: string; url: string }[] }
  | {
      tipo: 'documento'
      nome: string
      url: string
      descrizione?: string
      anteprima?: boolean
    }
  | {
      tipo: 'contatti'
      titolo?: string | null
      voci: { nome: string; email?: string | null; ruolo?: string | null; orari?: string | null }[]
    }

export type PaginaEstratta = {
  blocchi: BloccoGrezzo[]
  /** Paragrafo d'apertura di una pagina fatta solo di box verso le sottopagine. */
  sommario: string | null
}

/**
 * Riscrittura dei link: percorso sul sito attuale → percorso nuovo. `vecchi` viene dai link
 * delle pagine WordPress (es. "outgoing" → "erasmus/mobilita-studenti"); `docenti` dagli slug
 * WordPress dei docenti ("a.balzola" → "andrea-balzola").
 */
export type MappaPercorsi = { vecchi: Map<string, string>; docenti: Map<string, string> }

export const SITO = 'https://albertina-academy.it'

export function mappaPercorsi(
  pagineWp: { id: number; link: string }[],
  docenti: Map<string, string>,
): MappaPercorsi {
  const vecchi = new Map<string, string>()
  for (const p of pagineWp) {
    const nuovo = PAGINE_WP[p.id]
    if (!nuovo) continue
    const vecchio = p.link.replace(/^https?:\/\/[^/]+/, '').replace(/^\/+|\/+$/g, '')
    vecchi.set(vecchio, nuovo)
  }
  for (const p of Object.values(PAGINE_WP)) vecchi.set(p, p)
  for (const [k, v] of Object.entries(SPOSTATI)) vecchi.set(k, v)
  return { vecchi, docenti }
}

export function nuovoPercorso(p: string, m: MappaPercorsi): string | null {
  p = p.replace(/^\/+|\/+$/g, '')
  const noto = m.vecchi.get(p)
  if (noto) return noto
  if (p.startsWith('docente/')) {
    const d = m.docenti.get(p.split('/')[1].replace(/\./g, '-'))
    return d ? `docenti/${d}` : null
  }
  if (p.startsWith('calendario/')) return 'calendari'
  return null
}

const ENTITA: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: ' ',
}

export function decodificaEntita(s: string) {
  return s.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (e, c: string) => {
    if (c[0] === '#')
      return String.fromCodePoint(
        c[1] === 'x' || c[1] === 'X' ? parseInt(c.slice(2), 16) : Number(c.slice(1)),
      )
    return ENTITA[c.toLowerCase()] ?? e
  })
}

const escape = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

const senzaTag = (h: string) => decodificaEntita(h.replace(/<[^>]+>/g, ''))
const vuoto = (h: string) => !h.replace(/<[^>]+>|\s|&nbsp;| /g, '')

// Etichette dei box che rimandano alle sottopagine: la piattaforma le mostra già da sola
const CARD = /^(scopri di più|leggi tutto|visita il sito)$/i
// Segnaposto rimasti nei moduli di Breakdance (domande in inglese, lorem ipsum)
const SEGNAPOSTO =
  /lorem ipsum|convallis tellus|lifetime license|edit my address|free copy of a magazine/i

/** Elementi Breakdance che non diventano contenuto. */
const SALTA = [
  'bde-breadcrumbs',
  'bde-table-of-contents',
  'bde-post-loop',
  'bde-loop',
  'bde-posts-list',
  'bde-form-builder',
  'bde-login-form',
  'bde-register-form',
  'bde-forgot-password-form',
  'bde-icon',
  'bde-pulse-dot',
  'bde-badge',
  'bde-fancy-divider',
  'bde-code-block',
  'bde-google-map',
  'bde-logo-list',
  'bde-simple-counter',
  'bde-wrapper-link',
]

/** Struttura minima del DOM che serve (jsdom in produzione, qualsiasi DOM nei test). */
export type Nodo = {
  nodeType: number
  tagName?: string
  textContent: string | null
  childNodes: ArrayLike<Nodo>
}
export type El = Nodo & {
  tagName: string
  classList: { contains: (c: string) => boolean }
  innerHTML: string
  children: ArrayLike<El>
  parentElement: El | null
  getAttribute: (n: string) => string | null
  querySelector: (s: string) => El | null
  querySelectorAll: (s: string) => ArrayLike<El>
}

const ha = (e: El, c: string) => e.classList.contains(c)
const figli = (e: El) => Array.from(e.children)

/** Riscrive i link di un frammento HTML verso i nuovi indirizzi. */
function riscriviLinkHtml(s: string, m: MappaPercorsi) {
  s = s.replace(/https?:\/\/web\.archive\.org\/web\/\d+\//g, '')
  return s.replace(
    /(href=")(?:https?:\/\/(?:www\.)?(?:albertina-academy\.it|newalbertina\.eu))?(\/[\w\-/.]*?)\/?(#[\w-]*)?(?=")/g,
    (tutto, a: string, p: string, ancora?: string) => {
      const nuovo = nuovoPercorso(p, m)
      return nuovo ? `${a}/${nuovo}${ancora ?? ''}` : tutto
    },
  )
}

/** HTML di un widget di testo, ripulito da contenitori, stili e classi. */
function pulisci(s: string, m: MappaPercorsi) {
  s = (s || '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/\[breakdance_dynamic[^\]]*\]/g, '')
    .replace(/<(div|span|article|section)\b[^>]*>/g, '')
    .replace(/<\/(div|span|article|section)>/g, '')
    .replace(/\sstyle="[^"]*"/g, '')
    .replace(/\sclass="[^"]*"/g, '')
    .replace(/\sid="[^"]*"/g, '')
    // attributi che Breakdance aggiunge ai link (si ricalcolano sul nuovo sito)
    .replace(/\s(target|rel|data-[\w-]+|aria-[\w-]+)="[^"]*"/g, '')
  return riscriviLinkHtml(s, m).trim()
}

/** Indirizzo di un link Breakdance (pulsante, elenco), già riportato al nuovo sito. */
function urlLink(href: string | null, m: MappaPercorsi): string | null {
  let u = (href ?? '').trim()
  if (!u || u.startsWith('#')) return null
  if (u.startsWith('mailto:')) {
    const email = u.slice(7).split('?')[0]
    return email ? `mailto:${email}` : null
  }
  if (u.startsWith('tel:')) return `tel:${u.slice(4).replace(/\s/g, '')}`
  u = u.replace(/^https?:\/\/(www\.)?newalbertina\.eu/, SITO)
  if (u.startsWith('/')) u = SITO + u
  const r = /^https?:\/\/(?:www\.)?albertina-academy\.it(\/[^?#]*)?/.exec(u)
  if (r && !/\.\w{2,4}$/.test(r[1] ?? '')) {
    const nuovo = nuovoPercorso(r[1] ?? '/', m)
    if (nuovo) return `/${nuovo}`
  }
  return u
}

class Pagina {
  blocchi: BloccoGrezzo[] = []
  html: string[] = []
  contatti: string[] = []
  /** Elementi già usati (es. la didascalia di un'immagine). */
  usati = new Set<El>()

  chiudiTesto() {
    const h = this.html.join('').trim()
    if (!vuoto(h)) this.blocchi.push({ tipo: 'testo', html: h })
    this.html = []
  }

  aggiungiLink(etichettaHtml: string, url: string | null) {
    const etichetta = senzaTag(etichettaHtml || '').trim()
    if (!url || !etichetta) return
    if (url.startsWith('mailto:') || url.startsWith('tel:') || url.startsWith('http://')) {
      // Nel blocco link vanno solo indirizzi https e del sito: il resto resta nel testo
      this.html.push(`<p><a href="${escape(url)}">${escape(etichetta)}</a></p>`)
      return
    }
    this.chiudiTesto()
    let ult = this.blocchi.at(-1)
    if (!ult || ult.tipo !== 'link') {
      ult = { tipo: 'link', voci: [] }
      this.blocchi.push(ult)
    }
    if (!ult.voci.some((v) => v.url === url))
      ult.voci.push({ etichetta: etichetta.slice(0, 200), url })
  }

  aggiungiVoce(titolo: string, contenuto: string) {
    if (vuoto(contenuto)) return
    this.chiudiTesto()
    let ult = this.blocchi.at(-1)
    if (!ult || ult.tipo !== 'fisarmonica') {
      ult = { tipo: 'fisarmonica', voci: [] }
      this.blocchi.push(ult)
    }
    ult.voci.push({ titolo: senzaTag(titolo).trim().slice(0, 200), html: contenuto })
  }
}

/** HTML semplice di un sottoalbero (contenuto di fisarmoniche e schede). */
function htmlDi(nodi: El[], m: MappaPercorsi): string {
  const p = new Pagina()
  for (const n of nodi) visita(n, p, m, true)
  p.chiudiTesto()
  const out: string[] = []
  for (const b of p.blocchi) {
    if (b.tipo === 'testo') out.push(b.html)
    else if (b.tipo === 'link')
      out.push(
        `<ul>${b.voci.map((v) => `<li><a href="${escape(v.url)}">${escape(v.etichetta)}</a></li>`).join('')}</ul>`,
      )
    else if (b.tipo === 'fisarmonica')
      for (const v of b.voci) out.push(`<h3>${escape(v.titolo)}</h3>${v.html}`)
    else if (b.tipo === 'documento')
      out.push(`<p><a href="${escape(b.url)}">${escape(b.nome)}</a></p>`)
  }
  return out.join('')
}

/** Tabella → elenco "Intestazione: valore · …" (si legge bene anche sul telefono). */
function tabella(t: El): string {
  const intest = Array.from(t.querySelectorAll('thead th')).map((th) =>
    senzaTag(th.innerHTML.replace(/<br\s*\/?>/gi, ' '))
      .replace(/\s+/g, ' ')
      .trim(),
  )
  const righe = Array.from(t.querySelectorAll('tbody tr'))
  const out: string[] = []
  for (const r of righe) {
    const celle: string[] = []
    Array.from(r.querySelectorAll('td')).forEach((td, i) => {
      const v = (td.textContent ?? '').replace(/\s+/g, ' ').trim()
      if (!v) return
      celle.push(intest[i] ? `<strong>${escape(intest[i])}:</strong> ${escape(v)}` : escape(v))
    })
    if (celle.length) out.push(`<li>${celle.join(' · ')}</li>`)
  }
  return out.length ? `<ul>${out.join('')}</ul>` : ''
}

function testoSemplice(h: string) {
  return senzaTag(h.replace(/<br\s*\/?>|<\/p>/g, '\n'))
    .split('\n')
    .map((r) => r.replace(/\s+/g, ' ').trim())
    .filter(Boolean)
    .join('\n')
}

/** Griglia di schede "ufficio + persone + email" (pagina Contatti): diventa un blocco Contatti. */
function schedeContatto(griglia: El) {
  const voci: NonNullable<Extract<BloccoGrezzo, { tipo: 'contatti' }>['voci']> = []
  for (const d of figli(griglia)) {
    if (!ha(d, 'bde-div')) return null
    let nome: string | null = null
    let corpo = ''
    for (const f of figli(d)) {
      if ((ha(f, 'bde-text') || ha(f, 'bde-text-link') || ha(f, 'bde-button')) && !nome) {
        const t = senzaTag(f.innerHTML).replace(/\s+/g, ' ').trim()
        if (t) nome = t
      } else if (ha(f, 'bde-rich-text')) corpo += f.innerHTML
    }
    if (!nome || !corpo) return null
    const email = /mailto:([\w.+-]+@[\w.-]+)/.exec(corpo)
    const paragrafi = [...corpo.matchAll(/<p>([\s\S]*?)<\/p>/g)].map((x) => x[1])
    const persone = paragrafi.length ? testoSemplice(paragrafi[0]) : ''
    const resto = paragrafi.length
      ? corpo.slice(corpo.indexOf(paragrafi[0]) + paragrafi[0].length)
      : corpo
    const orari = testoSemplice(resto)
      .split('\n')
      .filter((r) => r && !r.includes('@'))
    voci.push({
      nome,
      ruolo: persone && !persone.includes('@') ? persone.replace(/\n/g, ', ') : null,
      email: email ? email[1] : null,
      orari: orari.join('\n') || null,
    })
  }
  return voci.length >= 3 ? voci : null
}

/** Documento incorporato (shortcode PDF Embedder o simili): primo link a un file. */
function documento(e: El): { nome: string; url: string } | null {
  for (const a of Array.from(e.querySelectorAll('a[href], object[data], iframe[src]'))) {
    const url = (a.getAttribute('href') ?? a.getAttribute('data') ?? a.getAttribute('src') ?? '')
      .trim()
      .replace(/^https?:\/\/(www\.)?newalbertina\.eu/, SITO)
    if (!/\/wp-content\/uploads\/.+\.pdf(\?|#|$)/i.test(url)) continue
    const nome = senzaTag(a.innerHTML ?? '').trim()
    return { nome: nome || decodeURIComponent(url.split('/').pop() ?? 'Documento'), url }
  }
  return null
}

/** Indirizzo dell'immagine originale (senza il ridimensionamento di WordPress). */
function urlImmagine(img: El | null): string | null {
  const src = (img?.getAttribute('src') ?? '')
    .trim()
    .replace(/^https?:\/\/(www\.)?newalbertina\.eu/, SITO)
  if (!/\/wp-content\/uploads\//.test(src) || /\.svg(\?|$)/i.test(src)) return null
  return src.replace(/-\d+x\d+(\.\w+)$/, '$1')
}

/** Didascalia di Breakdance: un testo breve subito dopo l'immagine, nello stesso contenitore. */
function didascalia(n: El, p: Pagina): string | null {
  const fratelli = n.parentElement ? figli(n.parentElement) : []
  const dopo = fratelli[fratelli.indexOf(n) + 1]
  if (!dopo || !ha(dopo, 'bde-text') || dopo.querySelector('a')) return null
  const t = senzaTag(dopo.innerHTML).replace(/\s+/g, ' ').trim()
  if (!t || t.length > 160) return null
  p.usati.add(dopo)
  return t
}

function visita(n: El, p: Pagina, m: MappaPercorsi, annidato = false): void {
  if (SALTA.some((c) => ha(n, c)) || p.usati.has(n)) return

  // Immagini del contenuto (foto, loghi dei finanziamenti); le icone SVG no
  if (ha(n, 'bde-image2') || ha(n, 'bde-image')) {
    const url = urlImmagine(n.tagName === 'IMG' ? n : n.querySelector('img'))
    if (!url || annidato) return
    p.chiudiTesto()
    p.blocchi.push({ tipo: 'immagine', url, didascalia: didascalia(n, p) })
    return
  }
  // Fisarmonica di immagini (es. le sedi): galleria con i titoli come didascalie
  if (ha(n, 'bde-image-accordion')) {
    const immagini = Array.from(n.querySelectorAll('.ee-image-accordion-item')).flatMap((v) => {
      const url = urlImmagine(v.querySelector('img'))
      const titolo = senzaTag(v.querySelector('.ee-image-accordion-title')?.innerHTML ?? '').trim()
      return url ? [{ url, didascalia: titolo || null }] : []
    })
    if (immagini.length < 2 || annidato) return
    p.chiudiTesto()
    // Come sul sito attuale: fascia a tutta larghezza che si apre al passaggio del mouse
    p.blocchi.push({ tipo: 'galleria', immagini, aspetto: 'fascia' })
    return
  }

  if (ha(n, 'bde-heading')) {
    const tag = n.tagName.toLowerCase()
    const testo = n.innerHTML
    if (tag === 'h1' || testo.includes('breakdance_dynamic') || vuoto(testo)) return
    const livello = tag === 'h2' && !annidato ? 'h2' : 'h3'
    p.html.push(`<${livello}>${pulisci(testo, m)}</${livello}>`)
    return
  }
  if (ha(n, 'bde-rich-text') || ha(n, 'bde-text')) {
    const testo = pulisci(n.innerHTML, m)
    // Data dinamica di Breakdance (nel database era un segnaposto e si saltava)
    if (!testo || SEGNAPOSTO.test(testo) || /^Ultimo aggiornamento:/i.test(testo)) return
    p.html.push(testo.startsWith('<') ? testo : `<p>${testo}</p>`)
    return
  }
  if (ha(n, 'bde-notification-bar')) {
    const titolo = n.querySelector('.ee-alertbox-title')
    const desc = n.querySelector('.ee-alertbox-desc')
    const t = (titolo?.innerHTML ?? '').trim()
    const d = (desc?.innerHTML ?? '').trim()
    if (SEGNAPOSTO.test(t + d) || vuoto(t + d)) return
    p.html.push(`<p><strong>${pulisci(t, m)}</strong>${t ? ' ' : ''}${pulisci(d, m)}</p>`)
    return
  }
  if (ha(n, 'bde-accordion')) {
    for (const w of Array.from(n.querySelectorAll('.bde-accordion__panel-content'))) {
      const voce = w.parentElement?.parentElement
      const titolo = voce?.querySelector('.bde-accordion__title')?.innerHTML ?? 'Dettagli'
      p.aggiungiVoce(titolo || 'Dettagli', htmlDi(figli(w), m))
    }
    return
  }
  if (ha(n, 'bde-frequently-asked-questions')) {
    for (const item of Array.from(n.querySelectorAll('.bde-faq__item'))) {
      const domanda = item.querySelector('.bde-faq__title')?.innerHTML ?? ''
      const risposta = item.querySelector('.bde-faq__answer-content')?.innerHTML ?? ''
      if (SEGNAPOSTO.test(domanda + risposta)) continue
      p.aggiungiVoce(domanda, pulisci(risposta, m))
    }
    return
  }
  if (ha(n, 'bde-advanced-tabs') || ha(n, 'bde-tabs')) {
    const titoli = Array.from(n.querySelectorAll('.bde-tabs__tab-title')).map((t) => t.innerHTML)
    const pannelli = Array.from(n.querySelectorAll('.bde-tabs__panel-content'))
    titoli.forEach((t, i) => {
      const corpo = pannelli[i] ? htmlDi(figli(pannelli[i]), m) : ''
      if (SEGNAPOSTO.test(corpo)) return
      p.aggiungiVoce(t || `Scheda ${i + 1}`, corpo)
    })
    return
  }
  if (ha(n, 'bde-icon-list')) {
    for (const li of Array.from(n.querySelectorAll('li'))) {
      const a = li.querySelector('a')
      if (!a) continue
      const t = a.querySelector('.bde-icon-list__text')
      p.aggiungiLink(t ? t.innerHTML : a.innerHTML, urlLink(a.getAttribute('href'), m))
    }
    return
  }
  if (ha(n, 'bde-button') || ha(n, 'bde-text-link')) {
    const a = n.tagName === 'A' ? n : n.querySelector('a')
    const u = urlLink(a?.getAttribute('href') ?? null, m)
    // La pianta della sede (immagine) diventa la planimetria interattiva del sito
    if (u && /\/piantina\.\w+$/i.test(u) && !annidato) {
      p.chiudiTesto()
      p.blocchi.push({ tipo: 'planimetria' })
      return
    }
    if (u?.startsWith('mailto:') && !annidato) {
      p.contatti.push(u.slice(7))
      return
    }
    const testo = a?.querySelector('.button-atom__text')?.innerHTML ?? a?.innerHTML ?? ''
    p.aggiungiLink(senzaTag(testo).trim() ? testo : (u ?? ''), u)
    return
  }
  if (ha(n, 'bde-shortcode')) {
    const d = documento(n)
    if (d) {
      p.chiudiTesto()
      p.blocchi.push({ tipo: 'documento', ...d })
    }
    return
  }
  if (ha(n, 'bde-grid') && !annidato) {
    const voci = schedeContatto(n)
    if (voci) {
      let titolo: string | null = null
      const html = p.html.join('')
      const r = /<h2>((?:(?!<h2>)[\s\S])*?)<\/h2>$/.exec(html)
      if (r) {
        titolo = senzaTag(r[1]).trim()
        p.html = [html.slice(0, r.index)]
      }
      p.chiudiTesto()
      p.blocchi.push({ tipo: 'contatti', titolo, voci })
      return
    }
  }
  if (n.tagName === 'TABLE') {
    const corpo = tabella(n)
    if (corpo) {
      const didascalia = n.querySelector('caption')?.textContent?.trim()
      if (didascalia) p.html.push(`<p><strong>${escape(didascalia)}</strong></p>`)
      p.html.push(corpo)
    }
    return
  }
  for (const f of figli(n)) visita(f, p, m, annidato)
}

/** Toglie i box "Scopri di più" verso le sottopagine e ricava l'eventuale sommario. */
function senzaBox(blocchi: BloccoGrezzo[]): PaginaEstratta {
  const out: BloccoGrezzo[] = []
  for (const b of blocchi) {
    if (b.tipo === 'link' && b.voci.every((v) => CARD.test(v.etichetta))) {
      const ult = out.at(-1)
      if (ult?.tipo === 'testo') {
        const h = ult.html.replace(
          /(<h[2-6]>(?:(?!<h[2-6]>)[\s\S])*?<\/h[2-6]>)(<p>(?:(?!<p>)[\s\S])*?<\/p>)?$/,
          '',
        )
        if (!vuoto(h)) ult.html = h
        else out.pop()
      }
      continue
    }
    out.push(b)
  }
  const unico = out.length === 1 && out[0].tipo === 'testo' ? out[0].html : null
  if (unico && /^<p>((?:(?!<p>)[\s\S])*?)<\/p>$/.test(unico)) {
    const sommario = senzaTag(unico.replace(/<br\s*\/?>/g, ' ')).trim()
    if (sommario.length <= 300) return { blocchi: [], sommario }
  }
  return { blocchi: out, sommario: null }
}

/** "Scarica la presentazione di Isidata (PDF)" → "Presentazione di Isidata". */
function nomeDaEtichetta(e: string) {
  const t = e
    .replace(/^scarica\s+(il |lo |la |i |gli |le |l['’])?/i, '')
    .replace(/\s*\((pdf|PDF)\)\s*$/, '')
    .trim()
  return t ? t[0].toUpperCase() + t.slice(1) : e
}

/**
 * Su WordPress il PDF incorporato è spesso preceduto dal link "Scarica …" allo stesso file:
 * il blocco Documento ha già il pulsante Scarica, quindi il link si toglie e la sua etichetta
 * diventa il titolo del documento (più chiaro del nome del file).
 */
function unisciDocumenti(blocchi: BloccoGrezzo[]): BloccoGrezzo[] {
  const out: BloccoGrezzo[] = []
  for (const b of blocchi) {
    const prima = out.at(-1)
    if (b.tipo === 'documento' && prima?.tipo === 'link') {
      const i = prima.voci.findIndex((v) => v.url === b.url)
      if (i >= 0) {
        const [voce] = prima.voci.splice(i, 1)
        if (!prima.voci.length) out.pop()
        out.push({ ...b, nome: nomeDaEtichetta(voce.etichetta) })
        continue
      }
    }
    out.push(b)
  }
  return out
}

/**
 * Blocchi di una pagina dal suo HTML. `radice` è il contenitore di `content.rendered`
 * (es. il body di jsdom). `titolo` serve per i contatti trovati nei pulsanti email.
 */
export function estraiPagina(
  radice: El,
  m: MappaPercorsi,
  o: { titolo: string; senzaContatti?: boolean },
): PaginaEstratta {
  const p = new Pagina()
  if (radice.querySelector('[class*="bde-"]')) for (const f of figli(radice)) visita(f, p, m)
  // Pagina classica (editor di WordPress, senza Breakdance): tutto il testo in un blocco
  else p.html.push(pulisci(radice.innerHTML, m))
  p.chiudiTesto()
  const r = senzaBox(unisciDocumenti(p.blocchi))
  r.blocchi = conTestiPdf(r.blocchi)
  // Contatti: PEO e PEC sono già nel footer
  const email = o.senzaContatti ? [] : [...new Set(p.contatti)]
  if (email.length)
    r.blocchi.unshift({
      tipo: 'contatti',
      voci: email.map((e) => ({ nome: o.titolo, email: e })),
    })
  return r
}
