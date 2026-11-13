/**
 * Calendari compilati dalla segreteria come tabelle (orario lezioni, esami, presentazioni):
 * colonne per tipo, normalizzazione delle righe e unione delle celle uguali per la stampa.
 * Condiviso tra pannello (editor a tabella) e sito (tabella con filtri).
 */

export const TIPI_CALENDARIO = ['lezioni', 'esami', 'presentazioni'] as const
export type TipoCalendario = (typeof TIPI_CALENDARIO)[number]

export const TIPO_LABELS: Record<TipoCalendario, string> = {
  lezioni: 'Orario delle lezioni',
  esami: 'Calendario esami',
  presentazioni: 'Presentazioni di scuole e corsi',
}

export type Colonna = {
  chiave: string
  etichetta: string
  /** Testo su più righe (textarea nel pannello, a capo nel sito). */
  lunga?: boolean
  /** Larghezza indicativa nel pannello, in caratteri. */
  larghezza?: number
  /** Colonna offerta come filtro nel sito. */
  filtro?: boolean
  esempio?: string
  /** Nel pannello: «ora» = selettore dell’ora; «docenti» = suggerimenti dall’elenco docenti
   *  (cognome come negli orari, oppure cognome e nome). */
  campo?: 'ora' | 'docenti-cognome' | 'docenti-completo'
}

export const COLONNE: Record<TipoCalendario, Colonna[]> = {
  lezioni: [
    {
      chiave: 'corso',
      etichetta: 'Corso',
      lunga: true,
      larghezza: 22,
      esempio: 'Anatomia artistica',
    },
    {
      chiave: 'livello',
      etichetta: 'Livello',
      lunga: true,
      larghezza: 14,
      filtro: true,
      esempio: 'Triennio',
    },
    {
      chiave: 'docenti',
      etichetta: 'Docenti',
      lunga: true,
      larghezza: 16,
      esempio: 'Ribero',
      campo: 'docenti-cognome',
    },
    {
      chiave: 'giorno',
      etichetta: 'Giorno',
      lunga: true,
      larghezza: 14,
      filtro: true,
      esempio: 'Giovedì',
    },
    { chiave: 'inizio', etichetta: 'Inizio', larghezza: 8, esempio: '9:30', campo: 'ora' },
    { chiave: 'fine', etichetta: 'Fine', larghezza: 8, esempio: '13:30', campo: 'ora' },
    {
      chiave: 'semestre',
      etichetta: 'Semestre',
      lunga: true,
      larghezza: 12,
      filtro: true,
      esempio: '1 e 2',
    },
    { chiave: 'aula', etichetta: 'Aula', lunga: true, larghezza: 12, esempio: 'Aula A02' },
  ],
  esami: [
    {
      chiave: 'docente',
      etichetta: 'Docente',
      larghezza: 18,
      esempio: 'Ajani Elisabetta',
      campo: 'docenti-completo',
    },
    {
      chiave: 'corso',
      etichetta: 'Corso',
      lunga: true,
      larghezza: 22,
      esempio: 'Scenografia per il cinema e TV',
    },
    {
      chiave: 'livello',
      etichetta: 'Livello',
      lunga: true,
      larghezza: 14,
      filtro: true,
      esempio: 'Triennio',
    },
    { chiave: 'data', etichetta: 'Data', larghezza: 10, filtro: true, esempio: '23/06/2026' },
    { chiave: 'ora', etichetta: 'Ora', larghezza: 8, esempio: '10:00', campo: 'ora' },
    {
      chiave: 'commissione',
      etichetta: 'Commissione',
      lunga: true,
      larghezza: 18,
      esempio: 'Ajani, Amadio, Voghera',
      campo: 'docenti-cognome',
    },
    { chiave: 'aula', etichetta: 'Aula', larghezza: 8, esempio: 'C28' },
  ],
  presentazioni: [
    {
      chiave: 'scuola',
      etichetta: 'Scuola o corso',
      larghezza: 18,
      filtro: true,
      esempio: 'Pittura',
    },
    {
      chiave: 'quando',
      etichetta: 'Date e indicazioni',
      lunga: true,
      larghezza: 36,
      esempio: '19/10/2026 ore 9.30 1° Triennio A-G',
    },
    {
      chiave: 'dove',
      etichetta: 'Docenti e aule',
      lunga: true,
      larghezza: 26,
      esempio: 'Prof. Garbolino, Aula R01c',
    },
  ],
}

export type Riga = Record<string, string>

/** Tiene solo le colonne del tipo, come testo ripulito; scarta le righe vuote. */
export function normalizzaRighe(tipo: TipoCalendario, righe: unknown): Riga[] {
  if (!Array.isArray(righe)) return []
  const colonne = COLONNE[tipo]
  return righe
    .filter((r): r is Record<string, unknown> => !!r && typeof r === 'object')
    .map((r) =>
      Object.fromEntries(
        colonne.map((c) => {
          const v = r[c.chiave]
          return [c.chiave, typeof v === 'string' ? v.replace(/\r\n?/g, '\n').trim() : '']
        }),
      ),
    )
    .filter((r) => Object.values(r).some(Boolean))
}

/**
 * Celle da unire in verticale (come nel PDF): una cella si unisce a quella sopra se ha lo stesso
 * valore e anche le colonne alla sua sinistra sono unite. Restituisce, per riga e colonna,
 * 0 se la cella è assorbita da quella sopra, altrimenti quante righe occupa.
 */
export function campateRighe(righe: Riga[], colonne: Colonna[], quante = 3): number[][] {
  const span = righe.map(() => colonne.map(() => 1))
  for (let c = 0; c < Math.min(quante, colonne.length); c++) {
    const k = colonne[c].chiave
    let inizio = 0
    for (let r = 1; r <= righe.length; r++) {
      const uguale =
        r < righe.length &&
        righe[r][k] !== '' &&
        righe[r][k] === righe[inizio][k] &&
        (c === 0 || span[r][c - 1] === 0)
      if (uguale) {
        span[r][c] = 0
        span[inizio][c] += 1
      } else {
        inizio = r
      }
    }
  }
  return span
}

/** Valori distinti di una colonna, per i filtri; i giorni in ordine di settimana. */
const GIORNI = ['lunedì', 'martedì', 'mercoledì', 'giovedì', 'venerdì', 'sabato', 'domenica']

export function valoriFiltro(righe: Riga[], chiave: string): string[] {
  const set = new Set<string>()
  for (const r of righe) {
    const v = r[chiave]
    if (!v) continue
    if (chiave === 'giorno') {
      for (const g of GIORNI)
        if (v.toLowerCase().includes(g)) set.add(g[0].toUpperCase() + g.slice(1))
    } else if (chiave === 'semestre') {
      for (const n of ['1', '2']) if (v.split('\n')[0].includes(n)) set.add(n)
    } else if (chiave === 'livello') {
      for (const l of ['Triennio', 'Biennio']) if (v.includes(l)) set.add(l)
    } else {
      set.add(v.split('\n')[0])
    }
  }
  const valori = [...set]
  if (chiave === 'giorno')
    return valori.sort((a, b) => GIORNI.indexOf(a.toLowerCase()) - GIORNI.indexOf(b.toLowerCase()))
  if (chiave === 'data')
    return valori.sort((a, b) => dataOrdinabile(a).localeCompare(dataOrdinabile(b)))
  return valori.sort((a, b) => a.localeCompare(b, 'it'))
}

/** Una riga corrisponde al filtro se la sua cella contiene il valore scelto. */
export function corrisponde(riga: Riga, chiave: string, valore: string): boolean {
  if (!valore) return true
  const v = riga[chiave] ?? ''
  if (chiave === 'semestre') return v.split('\n')[0].includes(valore)
  if (chiave === 'giorno' || chiave === 'livello')
    return v.toLowerCase().includes(valore.toLowerCase())
  return v.split('\n')[0] === valore
}

/** 23/06/2026 → 2026-06-23, per ordinare le date scritte all'italiana. */
export function dataOrdinabile(d: string): string {
  const m = /(\d{1,2})\/(\d{1,2})\/(\d{4})/.exec(d)
  return m ? `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}` : d
}

/**
 * Righe incollate da Excel, Numbers o Word (celle separate da tabulazioni, righe da a capo;
 * le celle con un a capo arrivano tra virgolette) → righe del calendario.
 */
export function righeDaIncolla(testo: string, colonne: Colonna[]): Riga[] {
  const t = testo.replace(/\r\n?/g, '\n')
  const righe: string[][] = []
  let riga: string[] = []
  let cella = ''
  let tra = false
  for (let i = 0; i < t.length; i++) {
    const ch = t[i]
    if (tra) {
      if (ch === '"' && t[i + 1] === '"') {
        cella += '"'
        i++
      } else if (ch === '"') tra = false
      else cella += ch
    } else if (ch === '"' && cella === '') tra = true
    else if (ch === '\t') {
      riga.push(cella)
      cella = ''
    } else if (ch === '\n') {
      riga.push(cella)
      righe.push(riga)
      riga = []
      cella = ''
    } else cella += ch
  }
  if (cella !== '' || riga.length) righe.push([...riga, cella])
  return righe
    .filter((r) => r.some((c) => c.trim() !== ''))
    .map((r) => Object.fromEntries(colonne.map((c, i) => [c.chiave, (r[i] ?? '').trim()])))
}

/* ---------- Aiuti per il pannello: orari e nomi dei docenti ---------- */

/** «9:30», «09.30», «9» → «09:30» per il selettore dell’ora; vuoto se non si capisce. */
export function oraPerSelettore(v: string | null | undefined): string {
  const m = /^\s*(\d{1,2})(?:[:.](\d{2}))?\s*$/.exec(v ?? '')
  if (!m) return ''
  const h = Number(m[1])
  const min = Number(m[2] ?? 0)
  if (h > 23 || min > 59) return ''
  return `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`
}

/** «09:30» dal selettore → «9:30», come negli orari già pubblicati. */
export function oraDaSelettore(v: string): string {
  const m = /^(\d{2}):(\d{2})/.exec(v)
  return m ? `${Number(m[1])}:${m[2]}` : ''
}

/** Separatori tra più docenti nella stessa cella: virgola, «e», a capo, barra. */
const SEPARATORE = /(,\s*|\s+e\s+|\n|\s*\/\s*)/

/** Il nome che si sta scrivendo: l’ultimo dopo un separatore. */
export function nomeInScrittura(testo: string): string {
  const pezzi = testo.split(SEPARATORE)
  return (pezzi.at(-1) ?? '').trimStart()
}

/** Sostituisce il nome in scrittura con quello scelto, lasciando gli altri docenti. */
export function sostituisciNome(testo: string, nome: string): string {
  const pezzi = testo.split(SEPARATORE)
  pezzi[pezzi.length - 1] = nome
  return pezzi.join('')
}

export type DocenteSuggerito = { id: number | string; nome: string; cognome: string }

/** Docenti che iniziano (cognome o nome) con quello che si scrive, senza badare agli accenti. */
export function filtraDocenti(docenti: DocenteSuggerito[], cerca: string, max = 8) {
  const piano = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
  const q = piano(cerca.trim())
  if (!q) return []
  return docenti
    .filter((d) => {
      const completo = piano(`${d.cognome} ${d.nome}`)
      return completo.startsWith(q) || piano(d.nome).startsWith(q) || completo.includes(` ${q}`)
    })
    .slice(0, max)
}
