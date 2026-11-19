/**
 * Calendario dello sportello della segreteria: giorni di apertura, turni e date nel fuso di
 * Roma. Funzioni pure (niente database), usate dal sito, dal pannello e dai test.
 */

export const FUSO = 'Europe/Rome'

export const GIORNI_SETTIMANA = [
  { value: '1', label: 'Lunedì' },
  { value: '2', label: 'Martedì' },
  { value: '3', label: 'Mercoledì' },
  { value: '4', label: 'Giovedì' },
  { value: '5', label: 'Venerdì' },
  { value: '6', label: 'Sabato' },
] as const

export type Fascia = { giorno?: string | null; dalle?: string | null; alle?: string | null }
export type Chiusura = {
  dal?: string | null
  al?: string | null
  /** Facoltative: chiusura solo per alcune ore. Vuote = tutto il giorno. */
  dalle?: string | null
  alle?: string | null
  motivo?: string | null
}
export type Apertura = { data?: string | null; dalle?: string | null; alle?: string | null }

export type ImpostazioniOrari = {
  orari?: Fascia[] | null
  chiusure?: Chiusura[] | null
  aperture?: Apertura[] | null
  durataTurno?: number | null
  personePerTurno?: number | null
  giorniPrenotabili?: number | null
  /** Giorni di anticipo minimo: 2 = da dopodomani. */
  giorniPreavviso?: number | null
}

export const ORA_VALIDA = /^([01]\d|2[0-3]):[0-5]\d$/

const parti = new Intl.DateTimeFormat('en-US', {
  timeZone: FUSO,
  hourCycle: 'h23',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
})

function componentiRoma(d: Date) {
  const p = Object.fromEntries(parti.formatToParts(d).map((x) => [x.type, x.value]))
  return {
    anno: Number(p.year),
    mese: Number(p.month),
    giorno: Number(p.day),
    ora: Number(p.hour),
    minuto: Number(p.minute),
    secondo: Number(p.second),
  }
}

/** Differenza in millisecondi tra l'ora di Roma e UTC in quell'istante. */
function scartoRoma(d: Date) {
  const c = componentiRoma(d)
  const comeUtc = Date.UTC(c.anno, c.mese - 1, c.giorno, c.ora, c.minuto, c.secondo)
  return comeUtc - Math.floor(d.getTime() / 1000) * 1000
}

const due = (n: number) => String(n).padStart(2, '0')

/** "2026-11-20" del giorno di Roma in cui cade l'istante. */
export function giornoRoma(d: Date): string {
  const c = componentiRoma(d)
  return `${c.anno}-${due(c.mese)}-${due(c.giorno)}`
}

/** "10:05" nell'ora di Roma. */
export function oraRoma(d: Date): string {
  const c = componentiRoma(d)
  return `${due(c.ora)}:${due(c.minuto)}`
}

/** Istante corrispondente a un giorno e un'ora di Roma (gestisce l'ora legale). */
export function istanteRoma(data: string, ora: string): Date {
  const [a, m, g] = data.split('-').map(Number)
  const [h, mi] = ora.split(':').map(Number)
  const comeUtc = Date.UTC(a, m - 1, g, h, mi)
  let t = comeUtc - scartoRoma(new Date(comeUtc))
  const correzione = scartoRoma(new Date(t))
  if (comeUtc - correzione !== t) t = comeUtc - correzione
  return new Date(t)
}

/** Giorno della settimana: 1 lunedì … 7 domenica. */
export function giornoSettimana(data: string): number {
  const [a, m, g] = data.split('-').map(Number)
  const d = new Date(Date.UTC(a, m - 1, g)).getUTCDay()
  return d === 0 ? 7 : d
}

export function aggiungiGiorni(data: string, giorni: number): string {
  const [a, m, g] = data.split('-').map(Number)
  const d = new Date(Date.UTC(a, m - 1, g + giorni))
  return `${d.getUTCFullYear()}-${due(d.getUTCMonth() + 1)}-${due(d.getUTCDate())}`
}

const minuti = (ora: string) => {
  const [h, m] = ora.split(':').map(Number)
  return h * 60 + m
}
const daMinuti = (n: number) => `${due(Math.floor(n / 60))}:${due(n % 60)}`

/** Solo la parte "YYYY-MM-DD" di una data salvata da Payload (che la salva come ISO). */
export const soloGiorno = (v?: string | null) => {
  if (!v) return ''
  if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return v
  // Le date del pannello arrivano come mezzogiorno UTC del giorno scelto
  return giornoRoma(new Date(v))
}

const ognigiorno = (c: Chiusura) => !(c.dalle && c.alle)

/** Chiusure che toccano quel giorno (intere o di qualche ora). */
export function chiusureDelGiorno(data: string, chiusure: Chiusura[] = []): Chiusura[] {
  return chiusure.filter((c) => {
    const dal = soloGiorno(c.dal)
    const al = soloGiorno(c.al) || dal
    return Boolean(dal && data >= dal && data <= al)
  })
}

/** Chiusura per tutto il giorno, se c'è. */
export function giornoChiuso(data: string, chiusure: Chiusura[] = []): Chiusura | null {
  return chiusureDelGiorno(data, chiusure).find(ognigiorno) ?? null
}

/** Il turno che inizia a quell'ora (con quella durata) cade in una chiusura? */
export function chiusuraDelTurno(
  data: string,
  ora: string,
  durata: number,
  chiusure: Chiusura[] = [],
): Chiusura | null {
  const inizio = minuti(ora)
  return (
    chiusureDelGiorno(data, chiusure).find(
      (c) =>
        ognigiorno(c) ||
        (ORA_VALIDA.test(c.dalle!) &&
          ORA_VALIDA.test(c.alle!) &&
          inizio < minuti(c.alle!) &&
          inizio + durata > minuti(c.dalle!)),
    ) ?? null
  )
}

/** Pasqua (calendario gregoriano, algoritmo di Meeus/Jones/Butcher): "YYYY-MM-DD". */
function pasqua(anno: number): string {
  const a = anno % 19
  const b = Math.floor(anno / 100)
  const c = anno % 100
  const d = Math.floor(b / 4)
  const e = b % 4
  const f = Math.floor((b + 8) / 25)
  const g = Math.floor((b - f + 1) / 3)
  const h = (19 * a + b - d - g + 15) % 30
  const i = Math.floor(c / 4)
  const k = c % 4
  const l = (32 + 2 * e + 2 * i - h - k) % 7
  const m = Math.floor((a + 11 * h + 22 * l) / 451)
  const mese = Math.floor((h + l - 7 * m + 114) / 31)
  const giorno = ((h + l - 7 * m + 114) % 31) + 1
  return `${anno}-${due(mese)}-${due(giorno)}`
}

const FESTE_FISSE: Record<string, string> = {
  '01-01': 'Capodanno',
  '01-06': 'Epifania',
  '04-25': 'Festa della Liberazione',
  '05-01': 'Festa del lavoro',
  '06-02': 'Festa della Repubblica',
  '06-24': 'San Giovanni, patrono di Torino',
  '08-15': 'Ferragosto',
  '11-01': 'Ognissanti',
  '12-08': 'Immacolata',
  '12-25': 'Natale',
  '12-26': 'Santo Stefano',
}

/** Festività nazionali e patrono di Torino: lo sportello è chiuso senza doverle inserire. */
export function festivita(data: string): string | null {
  const fissa = FESTE_FISSE[data.slice(5)]
  if (fissa) return fissa
  if (data === aggiungiGiorni(pasqua(Number(data.slice(0, 4))), 1)) return 'Lunedì dell’Angelo'
  return null
}

/** Fasce orarie di un giorno: orario settimanale più eventuali aperture straordinarie. */
export function fasceDelGiorno(
  data: string,
  imp: ImpostazioniOrari,
): { dalle: string; alle: string }[] {
  if (festivita(data) || giornoChiuso(data, imp.chiusure ?? [])) return []
  const gs = String(giornoSettimana(data))
  const fasce = [
    ...(imp.orari ?? []).filter((f) => f.giorno === gs),
    ...(imp.aperture ?? []).filter((a) => soloGiorno(a.data) === data),
  ]
  return fasce
    .filter((f) => f.dalle && f.alle && ORA_VALIDA.test(f.dalle) && ORA_VALIDA.test(f.alle))
    .map((f) => ({ dalle: f.dalle!, alle: f.alle! }))
    .sort((a, b) => a.dalle.localeCompare(b.dalle))
}

/** Orari d'inizio dei turni di un giorno ("10:00", "10:05", …), senza doppioni. */
export function turniDelGiorno(data: string, imp: ImpostazioniOrari): string[] {
  const durata = Math.max(1, imp.durataTurno || 5)
  const ore = new Set<string>()
  for (const f of fasceDelGiorno(data, imp)) {
    for (let t = minuti(f.dalle); t + durata <= minuti(f.alle); t += durata) {
      const ora = daMinuti(t)
      if (!chiusuraDelTurno(data, ora, durata, imp.chiusure ?? [])) ore.add(ora)
    }
  }
  return [...ore].sort()
}

/**
 * Giorni con almeno un turno, da oggi + `giorniPreavviso` fino a oggi + `giorniPrenotabili`.
 * La finestra scorre con i giorni: ogni mattina se ne aggiunge uno in fondo.
 */
export function giorniDiApertura(oggi: string, imp: ImpostazioniOrari, quanti?: number): string[] {
  const n = quanti ?? imp.giorniPrenotabili ?? 60
  const da = Math.max(0, imp.giorniPreavviso ?? 0)
  const giorni: string[] = []
  for (let i = da; i <= n; i++) {
    const g = aggiungiGiorni(oggi, i)
    if (turniDelGiorno(g, imp).length) giorni.push(g)
  }
  return giorni
}

const formatoGiorno = new Intl.DateTimeFormat('it-IT', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  timeZone: 'UTC',
})

/** "venerdì 20 novembre" */
export function etichettaGiorno(data: string): string {
  const [a, m, g] = data.split('-').map(Number)
  return formatoGiorno.format(new Date(Date.UTC(a, m - 1, g)))
}

/** "venerdì 20 novembre, ore 10:05" */
export function etichettaAppuntamento(inizio: Date | string): string {
  const d = typeof inizio === 'string' ? new Date(inizio) : inizio
  return `${etichettaGiorno(giornoRoma(d))}, ore ${oraRoma(d)}`
}
