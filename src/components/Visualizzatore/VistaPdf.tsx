'use client'

import type { PDFDocumentLoadingTask, PDFDocumentProxy, RenderTask, TextLayer } from 'pdfjs-dist'
import {
  type ReactNode,
  type RefObject,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react'
import { Button, Input, Label, NumberField } from 'react-aria-components'

import { PDF_IN_CSS, apriPdf, caricaPdfjs } from './pdfjs'
import {
  Barra,
  ControlliZoom,
  type PuntoPizzico,
  ZOOM_MAX,
  ZOOM_MIN,
  usePizzico,
  zoomVicino,
} from './strumenti'
import styles from './Visualizzatore.module.css'

type Dimensione = { w: number; h: number }
type Collegamento = { x: number; y: number; w: number; h: number } & (
  { href: string } | { dest: unknown }
)

/** Margine attorno alle pagine (px) e larghezza massima della pagina «adattata». */
const MARGINE = { telefono: 8, computer: 32 }
const LARGHEZZA_MAX_ADATTA = 1000
/** Nella pagina la vista è più bassa: pagina più piccola, se ne vede di più. */
const LARGHEZZA_MAX_INCORPORATA = 760
/** Pixel massimi di una tela: oltre, i telefoni esauriscono la memoria (iOS ~16 milioni). */
const PIXEL_MAX = 12_000_000

type Stato =
  | { fase: 'caricamento'; progresso: number | null }
  | { fase: 'pronto'; doc: PDFDocumentProxy }
  | { fase: 'errore'; motivo: 'password' | 'generico' }

export type VistaPdfProps = {
  url: string
  /** Nome del documento, per i lettori di schermo. */
  nome: string
  titolo: ReactNode
  azioni?: ReactNode
  chiudi?: ReactNode
  /** Nella pagina (non a schermo intero): niente fuoco automatico, tema chiaro. */
  incorporato?: boolean
  /** Messaggio d'errore con le azioni per aprire il file in altro modo. */
  alternativa?: ReactNode
}

/**
 * PDF disegnato da PDF.js: pagine una sotto l'altra, disegnate solo quando si avvicinano
 * alla vista (e liberate quando si allontanano), testo selezionabile e link cliccabili.
 */
export function VistaPdf({
  url,
  nome,
  titolo,
  azioni,
  chiudi,
  incorporato,
  alternativa,
}: VistaPdfProps) {
  const [stato, setStato] = useState<Stato>({ fase: 'caricamento', progresso: null })
  const [dimensioni, setDimensioni] = useState<Record<number, Dimensione>>({})
  const [zoom, setZoom] = useState<number | 'adatta'>('adatta')
  const [larghezza, setLarghezza] = useState(0)
  const [pagina, setPagina] = useState(1)
  const scorrimento = useRef<HTMLDivElement>(null)
  /** Punto da mantenere fermo quando cambia lo zoom: pagina e frazione della sua altezza. */
  const ancora = useRef<{ pagina: number; frazione: number; x: number } | null>(null)
  /** Dopo un pizzico: punto da tenere sotto le dita e zoom di partenza. */
  const pizzico = useRef<(PuntoPizzico & { da: number }) | null>(null)
  const pagine = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let annullato = false
    let task: PDFDocumentLoadingTask | null = null
    // Il componente si rimonta a ogni file (key = url): lo stato parte già da zero
    apriPdf(url, (progresso) => {
      if (!annullato) setStato({ fase: 'caricamento', progresso })
    })
      .then(async (t) => {
        task = t
        if (annullato) return t.destroy()
        const doc = await t.promise
        const prima = (await doc.getPage(1)).getViewport({ scale: PDF_IN_CSS })
        if (annullato) return
        setDimensioni({ 1: { w: prima.width, h: prima.height } })
        setStato({ fase: 'pronto', doc })
      })
      .catch(async (err: unknown) => {
        if (annullato) return
        const pdfjs = await caricaPdfjs().catch(() => null)
        const password = Boolean(pdfjs && err instanceof pdfjs.PasswordException)
        setStato({ fase: 'errore', motivo: password ? 'password' : 'generico' })
      })
    return () => {
      annullato = true
      void task?.destroy()
    }
  }, [url])

  // Larghezza disponibile, per lo zoom «adatta»
  useEffect(() => {
    const el = scorrimento.current
    if (!el) return
    const ro = new ResizeObserver(() => setLarghezza(el.clientWidth))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const telefono = larghezza > 0 && larghezza < 600
  const margine = telefono ? MARGINE.telefono : MARGINE.computer
  const base = dimensioni[1]
  const scalaAdatta = base
    ? Math.max(
        ZOOM_MIN,
        Math.min(
          ZOOM_MAX,
          (Math.min(
            larghezza - 2 * margine,
            incorporato ? LARGHEZZA_MAX_INCORPORATA : LARGHEZZA_MAX_ADATTA,
          ) || 1) / base.w,
        ),
      )
    : 1
  const scala = zoom === 'adatta' ? scalaAdatta : zoom

  const doc = stato.fase === 'pronto' ? stato.doc : null
  const numPagine = doc?.numPages ?? 0

  const elementoPagina = useCallback(
    (n: number) => scorrimento.current?.querySelector<HTMLElement>(`[data-pagina="${n}"]`),
    [],
  )

  /** Pagina corrente: l'ultima il cui inizio è sopra il 40% dell'altezza visibile. */
  const aggiornaPagina = useCallback(() => {
    const el = scorrimento.current
    if (!el) return
    const soglia = el.scrollTop + el.clientHeight * 0.4
    let corrente = 1
    for (const p of el.querySelectorAll<HTMLElement>('[data-pagina]')) {
      if (p.offsetTop <= soglia) corrente = Number(p.dataset.pagina)
      else break
    }
    setPagina(corrente)
  }, [])

  useEffect(() => {
    const el = scorrimento.current
    if (!el || !doc) return
    let frame = 0
    const onScroll = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(aggiornaPagina)
    }
    el.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      el.removeEventListener('scroll', onScroll)
      cancelAnimationFrame(frame)
    }
  }, [doc, aggiornaPagina])

  const cambiaZoom = useCallback(
    (nuovo: number | 'adatta') => {
      const el = scorrimento.current
      const p = elementoPagina(pagina)
      if (el && p) {
        ancora.current = {
          pagina,
          frazione: (el.scrollTop - p.offsetTop) / p.offsetHeight,
          x:
            el.scrollWidth > el.clientWidth
              ? (el.scrollLeft + el.clientWidth / 2) / el.scrollWidth
              : 0.5,
        }
      }
      setZoom(nuovo)
    },
    [pagina, elementoPagina],
  )

  // Dopo il cambio di zoom, riporta la vista allo stesso punto del documento
  useLayoutEffect(() => {
    const el = scorrimento.current
    const pz = pizzico.current
    if (pz && el) {
      pizzico.current = null
      const r = scala / pz.da
      el.scrollLeft = pz.cx * r - pz.vx
      el.scrollTop = pz.cy * r - pz.vy
      return
    }
    const a = ancora.current
    if (!a || !el) return
    ancora.current = null
    const p = elementoPagina(a.pagina)
    if (!p) return
    el.scrollTop = p.offsetTop + a.frazione * p.offsetHeight
    el.scrollLeft = a.x * el.scrollWidth - el.clientWidth / 2
  }, [scala, elementoPagina])

  const vaiAPagina = useCallback(
    (n: number) => {
      const p = elementoPagina(n)
      const el = scorrimento.current
      if (!p || !el) return
      el.scrollTo({ top: p.offsetTop - margine })
      setPagina(n)
    },
    [elementoPagina, margine],
  )

  // Fuoco sulle pagine: le frecce e Pagina giù scorrono subito il documento
  useEffect(() => {
    if (doc && !incorporato) scorrimento.current?.focus({ preventScroll: true })
  }, [doc, incorporato])

  // Ctrl + rotella (o pizzico sul trackpad): zoom del documento invece che della pagina web
  useEffect(() => {
    const el = scorrimento.current
    if (!el || !doc) return
    const onWheel = (e: WheelEvent) => {
      if (!e.ctrlKey) return
      e.preventDefault()
      cambiaZoom(zoomVicino(scala, e.deltaY < 0 ? 1 : -1))
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [doc, scala, cambiaZoom])

  usePizzico(
    scorrimento,
    pagine,
    scala,
    (nuova, punto) => {
      pizzico.current = { ...punto, da: scala }
      setZoom(nuova)
    },
    Boolean(doc),
  )

  const onTasto = (e: React.KeyboardEvent) => {
    if (e.target instanceof HTMLInputElement || e.metaKey || e.ctrlKey || e.altKey) return
    if (e.key === '+' || e.key === '=') cambiaZoom(zoomVicino(scala, 1))
    else if (e.key === '-') cambiaZoom(zoomVicino(scala, -1))
    else if (e.key === '0') cambiaZoom('adatta')
    else return
    e.preventDefault()
  }

  const onDimensione = useCallback((n: number, d: Dimensione) => {
    setDimensioni((prec) =>
      prec[n] && prec[n].w === d.w && prec[n].h === d.h ? prec : { ...prec, [n]: d },
    )
  }, [])

  const comandi = doc ? (
    <>
      <NumberField
        className={styles.campoPagina}
        value={pagina}
        minValue={1}
        maxValue={numPagine}
        onChange={(n) => Number.isFinite(n) && vaiAPagina(Math.round(n))}
        formatOptions={{ maximumFractionDigits: 0, useGrouping: false }}
        isWheelDisabled
      >
        <Label className={styles.etichettaPagina}>Pagina</Label>
        <Input className={styles.inputPagina} />
        <span className={styles.totalePagine}>di {numPagine}</span>
      </NumberField>
      <ControlliZoom
        scala={scala}
        adatta={zoom === 'adatta'}
        onZoom={cambiaZoom}
        onAdatta={() => cambiaZoom('adatta')}
      />
    </>
  ) : null

  return (
    <div className={styles.vista} data-incorporato={incorporato || undefined}>
      <Barra titolo={titolo} comandi={comandi} azioni={azioni} chiudi={chiudi} />
      {/* Contenitore scorrevole raggiungibile da tastiera (WCAG 2.1.1), con le scorciatoie dello zoom */}
      {/* eslint-disable jsx-a11y/no-noninteractive-tabindex, jsx-a11y/no-noninteractive-element-interactions */}
      <div
        ref={scorrimento}
        className={styles.contenuto}
        tabIndex={0}
        role="region"
        aria-label={`Pagine di ${nome}`}
        onKeyDown={onTasto}
        aria-busy={stato.fase === 'caricamento' || undefined}
      >
        {stato.fase === 'caricamento' ? (
          <Caricamento progresso={stato.progresso} />
        ) : stato.fase === 'errore' ? (
          <div className={styles.messaggio} role="alert">
            <p>
              {stato.motivo === 'password'
                ? 'Il documento è protetto da password: scaricalo per aprirlo con il tuo programma.'
                : 'Non è stato possibile mostrare l’anteprima di questo documento.'}
            </p>
            {alternativa}
          </div>
        ) : (
          <div
            ref={pagine}
            className={styles.pagine}
            style={{ padding: margine, gap: telefono ? 8 : 16 }}
          >
            {Array.from({ length: numPagine }, (_, i) => i + 1).map((n) => (
              <PaginaPdf
                key={n}
                doc={stato.doc}
                numero={n}
                scala={scala}
                dimensione={dimensioni[n] ?? base}
                onDimensione={onDimensione}
                radice={scorrimento}
                vaiAPagina={vaiAPagina}
              />
            ))}
          </div>
        )}
      </div>
      {/* eslint-enable jsx-a11y/no-noninteractive-tabindex, jsx-a11y/no-noninteractive-element-interactions */}
    </div>
  )
}

function Caricamento({ progresso }: { progresso: number | null }) {
  return (
    <div className={styles.messaggio}>
      <p role="status">Caricamento del documento…</p>
      <div
        className={styles.progresso}
        role="progressbar"
        aria-label="Caricamento del documento"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={progresso === null ? undefined : Math.round(progresso * 100)}
        data-indeterminato={progresso === null || undefined}
      >
        <span style={progresso === null ? undefined : { width: `${progresso * 100}%` }} />
      </div>
    </div>
  )
}

function PaginaPdf({
  doc,
  numero,
  scala,
  dimensione,
  onDimensione,
  radice,
  vaiAPagina,
}: {
  doc: PDFDocumentProxy
  numero: number
  scala: number
  dimensione: Dimensione
  onDimensione: (n: number, d: Dimensione) => void
  radice: RefObject<HTMLDivElement | null>
  vaiAPagina: (n: number) => void
}) {
  const pagina = useRef<HTMLDivElement>(null)
  const tela = useRef<HTMLDivElement>(null)
  const testo = useRef<HTMLDivElement>(null)
  const [vicina, setVicina] = useState(false)
  const [collegamenti, setCollegamenti] = useState<Collegamento[]>([])

  // Disegna solo le pagine vicine alla vista (una schermata e mezza sopra e sotto)
  useEffect(() => {
    const el = pagina.current
    if (!el) return
    const io = new IntersectionObserver(([voce]) => setVicina(voce.isIntersecting), {
      root: radice.current,
      rootMargin: '150% 0px',
    })
    io.observe(el)
    return () => io.disconnect()
  }, [radice])

  useEffect(() => {
    if (!vicina) {
      // Lontana: libera la memoria della tela e del testo
      const vecchia = tela.current?.querySelector('canvas')
      if (vecchia) {
        vecchia.width = 0
        vecchia.height = 0
        vecchia.remove()
      }
      testo.current?.replaceChildren()
      return
    }
    let annullato = false
    let disegno: RenderTask | null = null
    let livelloTesto: TextLayer | null = null
    ;(async () => {
      const [pdfjs, page] = await Promise.all([caricaPdfjs(), doc.getPage(numero)])
      if (annullato) return
      const naturale = page.getViewport({ scale: PDF_IN_CSS })
      onDimensione(numero, { w: naturale.width, h: naturale.height })
      const viewport = page.getViewport({ scale: scala * PDF_IN_CSS })
      let rapporto = Math.min(window.devicePixelRatio || 1, 2)
      const area = viewport.width * viewport.height
      if (area * rapporto * rapporto > PIXEL_MAX) rapporto = Math.sqrt(PIXEL_MAX / area)
      // Nuova tela disegnata a parte e sostituita a fine disegno: nessun lampo bianco con lo zoom
      const canvas = document.createElement('canvas')
      canvas.width = Math.floor(viewport.width * rapporto)
      canvas.height = Math.floor(viewport.height * rapporto)
      canvas.setAttribute('aria-hidden', 'true')
      disegno = page.render({
        canvas,
        viewport,
        transform: rapporto === 1 ? undefined : [rapporto, 0, 0, rapporto, 0, 0],
      })
      await disegno.promise
      if (annullato) return
      const vecchia = tela.current?.querySelector('canvas')
      tela.current?.replaceChildren(canvas)
      if (vecchia) {
        vecchia.width = 0
        vecchia.height = 0
      }
      // Testo trasparente sopra il disegno: si può selezionare, copiare e cercare
      if (testo.current) {
        testo.current.replaceChildren()
        livelloTesto = new pdfjs.TextLayer({
          textContentSource: page.streamTextContent(),
          container: testo.current,
          viewport,
        })
        await livelloTesto.render()
      }
    })().catch(() => {
      // Disegno annullato (zoom cambiato, pagina lontana) o pagina danneggiata: si riprova al prossimo giro
    })
    return () => {
      annullato = true
      disegno?.cancel()
      livelloTesto?.cancel()
    }
  }, [vicina, scala, doc, numero, onDimensione])

  // Link del PDF (indirizzi web e rimandi interni), una volta per pagina
  useEffect(() => {
    if (!vicina || collegamenti.length) return
    let annullato = false
    ;(async () => {
      const page = await doc.getPage(numero)
      const naturale = page.getViewport({ scale: 1 })
      const annotazioni = await page.getAnnotations({ intent: 'display' })
      const voci: Collegamento[] = []
      for (const a of annotazioni) {
        if (a.subtype !== 'Link') continue
        const [ax1, ay1, ax2, ay2] = a.rect as number[]
        const [x1, y1] = naturale.convertToViewportPoint(ax1, ay1) as number[]
        const [x2, y2] = naturale.convertToViewportPoint(ax2, ay2) as number[]
        const r = {
          x: (Math.min(x1, x2) / naturale.width) * 100,
          y: (Math.min(y1, y2) / naturale.height) * 100,
          w: (Math.abs(x2 - x1) / naturale.width) * 100,
          h: (Math.abs(y2 - y1) / naturale.height) * 100,
        }
        if (typeof a.url === 'string' && /^(https?:|mailto:|tel:)/i.test(a.url)) {
          voci.push({ ...r, href: a.url })
        } else if (a.dest) {
          voci.push({ ...r, dest: a.dest })
        }
      }
      if (!annullato) setCollegamenti(voci)
    })().catch(() => {})
    return () => {
      annullato = true
    }
  }, [vicina, doc, numero, collegamenti.length])

  const seguiRimando = async (dest: unknown) => {
    try {
      const esplicita = typeof dest === 'string' ? await doc.getDestination(dest) : dest
      if (!Array.isArray(esplicita)) return
      const rif = esplicita[0]
      const indice =
        typeof rif === 'number'
          ? rif
          : await doc.getPageIndex(rif as Parameters<PDFDocumentProxy['getPageIndex']>[0])
      vaiAPagina(indice + 1)
    } catch {
      // Rimando non valido: non succede nulla
    }
  }

  const larghezza = dimensione.w * scala
  const altezza = dimensione.h * scala
  return (
    <div
      ref={pagina}
      className={styles.pagina}
      data-pagina={numero}
      style={
        {
          width: larghezza,
          height: altezza,
          '--total-scale-factor': scala * PDF_IN_CSS,
          '--scale-round-x': '1px',
          '--scale-round-y': '1px',
        } as React.CSSProperties
      }
    >
      <div ref={tela} className={styles.tela} />
      <div ref={testo} className={`textLayer ${styles.testoPdf}`} />
      {collegamenti.length ? (
        <div className={styles.collegamenti}>
          {collegamenti.map((c, i) => {
            const stile = { left: `${c.x}%`, top: `${c.y}%`, width: `${c.w}%`, height: `${c.h}%` }
            return 'href' in c ? (
              <a
                key={i}
                href={c.href}
                style={stile}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`${c.href.replace(/^mailto:/i, '')} (si apre in una nuova scheda)`}
              />
            ) : (
              <Button
                key={i}
                style={stile}
                aria-label="Vai al punto indicato nel documento"
                onPress={() => void seguiRimando(c.dest)}
              />
            )
          })}
        </div>
      ) : null}
      <span className="visually-hidden">Pagina {numero}</span>
    </div>
  )
}
