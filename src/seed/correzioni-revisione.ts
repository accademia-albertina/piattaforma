/**
 * Correzioni ai contenuti già salvati dopo la revisione del sito di Fede (2026-11-18).
 * Ogni passo controlla da sé se serve, quindi a ogni avvio non cambia niente di nuovo; le
 * modifiche passano `context.importazione` e non segnano la pagina come “modificata nel pannello”.
 */
import type { Payload } from 'payload'

import { maiuscoleLauree, maiuscoleLaureeLexical } from '@/lib/terminologia'
import type { Navigazione, Pagina } from '@/payload-types'

type Nodo = {
  type?: string
  tag?: string
  text?: string
  /** Numero sui testi (grassetto = 1, barrato = 4), stringa sui blocchi (allineamento). */
  format?: number | string
  children?: Nodo[]
  [k: string]: unknown
}
type Blocco = NonNullable<Pagina['blocchi']>[number]

const CONTESTO = { importazione: true, disableRevalidate: true }

const testo = (text: string, format = 0): Nodo => ({
  type: 'text',
  text,
  format,
  mode: 'normal',
  style: '',
  detail: 0,
  version: 1,
})
const a_capo = (): Nodo => ({ type: 'linebreak', version: 1 })
const paragrafo = (children: Nodo[]): Nodo => ({
  type: 'paragraph',
  format: '',
  indent: 0,
  version: 1,
  children,
  direction: null,
  textFormat: 0,
  textStyle: '',
})
const elenco = (voci: Nodo[][]): Nodo => ({
  type: 'list',
  tag: 'ul',
  listType: 'bullet',
  start: 1,
  format: '',
  indent: 0,
  version: 1,
  direction: null,
  children: voci.map((children, i) => ({
    type: 'listitem',
    value: i + 1,
    format: '',
    indent: 0,
    version: 1,
    direction: null,
    children,
  })),
})

const testoDi = (n: Nodo): string =>
  n.type === 'text' ? (n.text ?? '') : (n.children ?? []).map(testoDi).join('')

const radice = (b: Blocco): Nodo | null =>
  b.blockType === 'testo' ? ((b.testo as unknown as { root: Nodo }).root ?? null) : null

async function paginaDa(payload: Payload, percorso: string) {
  const { docs } = await payload.find({
    collection: 'pagine',
    where: { percorso: { equals: percorso } },
    depth: 0,
    limit: 1,
    overrideAccess: true,
  })
  return docs[0] ?? null
}

async function salvaPagina(payload: Payload, p: Pagina, data: Partial<Pagina>, nota: string) {
  await payload.update({
    collection: 'pagine',
    id: p.id,
    data,
    depth: 0,
    overrideAccess: true,
    context: CONTESTO,
  })
  payload.logger.info(`Revisione: ${nota}.`)
}

/** Ordinamento: testo corretto come chiede Gerardo, senza i suoi commenti per Federico. */
async function ordinamento(payload: Payload) {
  const p = await paginaDa(payload, 'accademia/ordinamento')
  if (!p?.blocchi) return
  let cambiato = false
  for (const b of p.blocchi) {
    const r = radice(b)
    if (!r?.children) continue
    r.children = r.children.map((n) => {
      const t = testoDi(n)
      if (n.type === 'paragraph' && /FEDERICO|NON sono più EQUIPOLLENTI/.test(t)) {
        cambiato = true
        return paragrafo([
          testo('I titoli rilasciati da tali istituzioni non sono più equipollenti: sono '),
          testo('Lauree', 1),
          testo(' (Laurea e Laurea Magistrale).'),
        ])
      }
      if (
        n.type === 'paragraph' &&
        t === "Ministero dell'Istruzione, dell'Università e della Ricerca"
      ) {
        cambiato = true
        return paragrafo([testo('Ministero dell’Università e della Ricerca')])
      }
      return n
    })
    const visita = (n: Nodo) => {
      if (!n.children) return
      // Testo barrato lasciato come nota («ai titoli di studio universitari») e a capo che lo precedono
      const prima = n.children.length
      n.children = n.children.filter((c) => !(c.type === 'text' && Number(c.format ?? 0) & 4))
      if (n.children.length !== prima) {
        while (n.children.at(-1)?.type === 'linebreak') n.children.pop()
        cambiato = true
      }
      for (const c of n.children) {
        if (c.type === 'text' && c.text) {
          const nuovo = c.text
            .replace('Esse istituisono', 'Esse istituiscono')
            .replace(
              "sono istituiti i corsi di triennio (ordinamentale dal'A.A. 2008/2009) e biennio sperimentale (3+2)",
              'sono istituiti i corsi di Laurea (Triennio, ordinamentale dall’A.A. 2008/2009) e di Laurea Magistrale (Biennio sperimentale, 3+2)',
            )
          if (nuovo !== c.text) {
            c.text = nuovo
            cambiato = true
          }
        }
        visita(c)
      }
    }
    visita(r)
  }
  if (cambiato) await salvaPagina(payload, p, { blocchi: p.blocchi }, 'Ordinamento corretto')
}

const UFFICI: [string, string][] = [
  ['Segreteria didattica', 'didattica@albertina.academy'],
  ['Ufficio protocollo', 'protocollo@albertina.academy'],
  ['Ufficio Erasmus', 'erasmus@albertina.academy'],
  ['Biblioteca', 'biblioteca@albertina.academy'],
  ['Consulta degli studenti', 'consulta@albertina.academy'],
  ['Ufficio personale', 'personale@albertina.academy'],
  ['Ufficio acquisti', 'acquisti@albertina.academy'],
  ['Ufficio logistica, manutenzione e sicurezza', 'logistica@albertina.academy'],
]

/** Contatti: Mail e Richiedi informazioni erano titoli vuoti; in fondo la mappa della sede. */
async function contatti(payload: Payload) {
  const p = await paginaDa(payload, 'contatti')
  if (!p?.blocchi) return
  let cambiato = false
  for (const b of p.blocchi) {
    const r = radice(b)
    if (!r?.children) continue
    const figli: Nodo[] = []
    r.children.forEach((n, i) => {
      figli.push(n)
      const vuoto = (k: number) => !r.children![k] || r.children![k].type === 'heading'
      if (n.type !== 'heading' || !vuoto(i + 1)) return
      const t = testoDi(n).trim()
      if (t === 'Mail') {
        figli.push(
          paragrafo([
            testo('PEO: protocollo@albertina.academy'),
            a_capo(),
            testo('PEC: accademia.torino@pec.it'),
          ]),
        )
        cambiato = true
      } else if (t === 'Richiedi informazioni') {
        figli.push(
          paragrafo([testo('Scrivi direttamente all’ufficio che si occupa della tua richiesta:')]),
          elenco(UFFICI.map(([nome, email]) => [testo(`${nome}: `, 1), testo(email)])),
          paragrafo([
            testo(
              'Per domande sull’uso del sito e sull’accesso con Google guarda prima la pagina ',
            ),
            {
              type: 'link',
              version: 3,
              format: '',
              indent: 0,
              direction: null,
              fields: { linkType: 'custom', url: '/assistenza', newTab: false },
              children: [testo('Assistenza')],
            },
            testo('.'),
          ]),
        )
        cambiato = true
      }
    })
    r.children = figli
  }
  if (!p.blocchi.some((b) => b.blockType === 'mappa')) {
    p.blocchi.push({
      blockType: 'mappa',
      indirizzo: 'Via Accademia Albertina 6, 10123 Torino',
      nome: 'Accademia Albertina di Belle Arti',
    })
    cambiato = true
  }
  if (cambiato) await salvaPagina(payload, p, { blocchi: p.blocchi }, 'pagina Contatti completata')
}

/** Storia e sedi: le foto delle sedi tornano una fascia a tutta larghezza, come sul sito attuale. */
async function sedi(payload: Payload) {
  const p = await paginaDa(payload, 'accademia/storia-e-sedi')
  const g = p?.blocchi?.find((b) => b.blockType === 'galleria')
  if (!p || !g || g.blockType !== 'galleria' || g.aspetto === 'fascia') return
  g.aspetto = 'fascia'
  await salvaPagina(payload, p, { blocchi: p.blocchi }, 'foto delle sedi a fascia')
}

/** Dottorati: le due fasce di loghi del sito attuale (istituzioni e finanziamento PNRR). */
const LOGHI_DOTTORATI = ['istituzioni_dottorati', 'next-gen-eu-mur']

async function loghiDottorati(payload: Payload) {
  const p = await paginaDa(payload, 'dottorati/albertina')
  if (!p?.blocchi) return
  const { docs } = await payload.find({
    collection: 'media',
    where: { or: LOGHI_DOTTORATI.map((f) => ({ filename: { like: f } })) },
    depth: 0,
    limit: 10,
    overrideAccess: true,
  })
  const presenti = new Set(
    p.blocchi.flatMap((b) =>
      b.blockType === 'immagine'
        ? [typeof b.immagine === 'object' ? b.immagine?.id : b.immagine]
        : [],
    ),
  )
  const nuovi = LOGHI_DOTTORATI.flatMap((f) => {
    const m = docs.find((d) => d.filename?.startsWith(f))
    return m && !presenti.has(m.id)
      ? [
          {
            blockType: 'immagine' as const,
            immagine: m.id,
            didascalia: null,
            larghezza: 'testo' as const,
          },
        ]
      : []
  })
  if (!nuovi.length) return
  await salvaPagina(
    payload,
    p,
    { blocchi: [...p.blocchi, ...nuovi] },
    'loghi del Dottorato aggiunti',
  )
}

/** Piani di studio oscurata: i piani sono nelle pagine delle scuole (/scuole). */
async function pianiDiStudio(payload: Payload) {
  const p = await paginaDa(payload, 'didattica/piani-di-studio')
  if (!p || p._status !== 'published') return
  await salvaPagina(payload, p, { _status: 'draft' }, 'Piani di studio oscurata')
}

/** Assistenza: dopo la chiusura delle iscrizioni non si rimanda alla Segreteria (Fede). */
async function assistenza(payload: Payload) {
  const p = await paginaDa(payload, 'assistenza')
  if (!p?.blocchi) return
  let cambiato = false
  for (const b of p.blocchi) {
    if (b.blockType !== 'fisarmonica') continue
    for (const v of b.voci) {
      const r = (v.testo as unknown as { root: Nodo }).root
      const visita = (n: Nodo) => {
        const c = n.children
        if (!c) return
        const i = c.findIndex(
          (x) => x.type === 'text' && x.text?.includes(' Dopo la chiusura scrivi alla '),
        )
        if (i >= 0) {
          c[i].text = c[i].text!.replace(/ Dopo la chiusura scrivi alla $/, '')
          // via il link alla Segreteria e il punto finale
          n.children = c.slice(0, i + 1).concat(c.slice(i + 3))
          cambiato = true
        }
        n.children?.forEach(visita)
      }
      visita(r)
    }
  }
  if (cambiato) await salvaPagina(payload, p, { blocchi: p.blocchi }, 'Assistenza aggiornata')
}

/** Menu: Scuole al posto di Piani di studio; Matricole tra le pagine Studente. */
async function menu(payload: Payload) {
  const n = await payload.findGlobal({ slug: 'navigazione', depth: 0, overrideAccess: true })
  let cambiato = false
  type Gruppo = NonNullable<NonNullable<Navigazione['colonne']>[number]['gruppi']>[number]
  const piani = (await paginaDa(payload, 'didattica/piani-di-studio'))?.id
  type Voce = NonNullable<Gruppo['voci']>[number]
  const isPiani = (v: Voce) =>
    v.url === '/didattica/piani-di-studio' ||
    (v.tipo === 'interno' &&
      piani != null &&
      (typeof v.pagina === 'object' ? v.pagina?.id : v.pagina) === piani)
  const sistema = (g: Gruppo): Gruppo => {
    let voci = g.voci ?? []
    if (voci.some(isPiani)) {
      voci = voci.map((v) =>
        isPiani(v)
          ? { ...v, etichetta: 'Scuole', tipo: 'percorso' as const, url: '/scuole', pagina: null }
          : v,
      )
      cambiato = true
    }
    if (g.titolo === 'Studente' && !voci.some((v) => v.url === '/studente/matricole')) {
      voci = [
        { etichetta: 'Matricole', tipo: 'percorso' as const, url: '/studente/matricole' },
        ...voci,
      ]
      cambiato = true
    }
    return { ...g, voci }
  }
  const colonne = (n.colonne ?? []).map((c) => ({ ...c, gruppi: (c.gruppi ?? []).map(sistema) }))
  if (!cambiato) return
  await payload.updateGlobal({ slug: 'navigazione', data: { colonne }, overrideAccess: true })
  payload.logger.info('Revisione: menu aggiornato (Scuole, Matricole).')
}

/**
 * «Laurea» e «Laurea Magistrale» con la maiuscola e, dove si parla dei livelli, (Triennio) e
 * (Biennio) tra parentesi: pagine, scuole e home.
 */
async function terminologia(payload: Payload) {
  const pagine = await payload.find({
    collection: 'pagine',
    depth: 0,
    limit: 500,
    overrideAccess: true,
    pagination: false,
  })
  let n = 0
  for (const p of pagine.docs) {
    const data = {
      sommario: p.sommario ? maiuscoleLauree(p.sommario) : p.sommario,
      blocchi: maiuscoleLaureeLexical(p.blocchi),
    }
    if (JSON.stringify(data) === JSON.stringify({ sommario: p.sommario, blocchi: p.blocchi }))
      continue
    await payload.update({
      collection: 'pagine',
      id: p.id,
      data,
      depth: 0,
      overrideAccess: true,
      context: CONTESTO,
    })
    n++
  }
  const scuole = await payload.find({
    collection: 'scuole',
    depth: 0,
    limit: 50,
    overrideAccess: true,
    pagination: false,
  })
  for (const s of scuole.docs) {
    const data = { triennio: s.triennio, biennio: s.biennio, descrizione: s.descrizione }
    const nuovi = {
      ...maiuscoleLaureeLexical(data),
      descrizione: s.descrizione ? maiuscoleLauree(s.descrizione) : s.descrizione,
    }
    if (JSON.stringify(nuovi) === JSON.stringify(data)) continue
    await payload.update({
      collection: 'scuole',
      id: s.id,
      data: nuovi,
      depth: 0,
      overrideAccess: true,
      context: CONTESTO,
    })
    n++
  }
  // Home: solo i testi (non i valori delle icone, es. «laurea»)
  const h = await payload.findGlobal({ slug: 'home', depth: 0, overrideAccess: true })
  const m = (t: string | null | undefined) => (t ? maiuscoleLauree(t) : t)
  const home = {
    accessiTesto: m(h.accessiTesto),
    accessi: h.accessi?.map((a) => ({ ...a, testo: m(a.testo) })),
    cifre: h.cifre?.map((c) => ({ ...c, etichetta: m(c.etichetta) ?? c.etichetta })),
    scuoleTitolo: m(h.scuoleTitolo),
    scuoleTesto: m(h.scuoleTesto),
  }
  const prima = {
    accessiTesto: h.accessiTesto,
    accessi: h.accessi,
    cifre: h.cifre,
    scuoleTitolo: h.scuoleTitolo,
    scuoleTesto: h.scuoleTesto,
  }
  if (JSON.stringify(home) !== JSON.stringify(prima)) {
    await payload.updateGlobal({ slug: 'home', data: home as never, overrideAccess: true })
    n++
  }
  if (n) payload.logger.info(`Revisione: Laurea / Laurea Magistrale aggiornate in ${n} contenuti.`)
}

export async function correzioniRevisione(payload: Payload) {
  for (const passo of [
    menu,
    pianiDiStudio,
    ordinamento,
    contatti,
    sedi,
    loghiDottorati,
    assistenza,
    terminologia,
  ]) {
    await passo(payload).catch((e) =>
      payload.logger.error(`Revisione (${passo.name}) non riuscita: ${(e as Error).message}`),
    )
  }
}
