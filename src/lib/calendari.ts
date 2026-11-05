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
    { chiave: 'docenti', etichetta: 'Docenti', lunga: true, larghezza: 16, esempio: 'Ribero' },
    {
      chiave: 'giorno',
      etichetta: 'Giorno',
      lunga: true,
      larghezza: 14,
      filtro: true,
      esempio: 'Giovedì',
    },
    { chiave: 'inizio', etichetta: 'Inizio', larghezza: 6, esempio: '9:30' },
    { chiave: 'fine', etichetta: 'Fine', larghezza: 6, esempio: '13:30' },
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
    { chiave: 'docente', etichetta: 'Docente', larghezza: 16, esempio: 'Ajani Elisabetta' },
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
    { chiave: 'ora', etichetta: 'Ora', larghezza: 6, esempio: '10:00' },
    {
      chiave: 'commissione',
      etichetta: 'Commissione',
      lunga: true,
      larghezza: 18,
      esempio: 'Ajani, Amadio, Voghera',
    },
    { chiave: 'aula', etichetta: 'Aula', larghezza: 8, esempio: 'C28' },
  ],
  presentazioni: [
    { chiave: 'scuola', etichetta: 'Scuola', larghezza: 14, filtro: true, esempio: 'Pittura' },
    {
      chiave: 'quando',
      etichetta: 'Data e ora',
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
