/**
 * Titoli scritti tutti in maiuscolo: si leggono male e sembrano gridati (richiesta di Fede).
 * `tuttoMaiuscolo` li riconosce, `validaMaiuscole` li rifiuta nel pannello e `inFrase` riscrive
 * quelli importati dal sito attuale in minuscolo con l'iniziale maiuscola, tenendo le sigle.
 */

/** Sigle e nomi propri che restano come sono quando si riscrive un titolo maiuscolo. */
const SIGLE = new Set([
  'AFAM',
  'MUR',
  'MIUR',
  'MIM',
  'CCNL',
  'CCNI',
  'CGIL',
  'FLC',
  'CISL',
  'UIL',
  'RUA',
  'SNALS',
  'ANIEF',
  'UNAMS',
  'GILDA',
  'RSU',
  'ISEE',
  'EDISU',
  'CFA',
  'CIG',
  'CUP',
  'DURC',
  'PNRR',
  'PON',
  'UE',
  'EU',
  'IT',
  'ENG',
  'PDF',
  'ICT',
  'RTD',
  'DPO',
  'GDPR',
  'ANAC',
  'MEPA',
  'CONSIP',
  'DSGA',
  'ABA',
  'ABAV',
  'PAI',
  'DD',
  'DM',
  'DPR',
  'DL',
  'NB',
  'ID',
  'SPID',
  'IVA',
  'INPS',
  'INAIL',
])
const NOMI = new Set([
  'accademia',
  'albertina',
  'belle',
  'arti',
  'torino',
  'italia',
  'ministero',
  'erasmus',
  'piemonte',
  'regione',
  'repubblica',
  'direttore',
  'presidente',
])
// Numeri romani dei cicli e degli articoli (XLI, III…): almeno due lettere, così "L’" e "I" no
const ROMANI = /^(?=[IVXL]{2,}$)(XL|L?X{0,3})(IX|IV|V?I{0,3})$/

const lettere = (s: string) => s.replace(/[^\p{L}]/gu, '')

const PAROLA = /[\p{L}][\p{L}\d.]*/gu

/** Parola scritta in maiuscolo che non è una sigla, un numero romano o un'abbreviazione puntata. */
function gridata(parola: string): boolean {
  const pulita = parola.replace(/\.+$/, '')
  if (lettere(pulita).length < 1 || pulita !== pulita.toUpperCase()) return false
  if (/\d/.test(pulita)) return false // codici come AFAM116, ABPR17
  return !(SIGLE.has(lettere(pulita)) || ROMANI.test(pulita) || /\p{L}\.\p{L}/u.test(pulita))
}

type Tratto = { inizio: number; fine: number; parole: RegExpExecArray[] }

/**
 * Tratti di testo gridato: almeno tre parole maiuscole di fila (contano anche le sigle e le
 * parole brevi come DI, E) di cui almeno due lunghe e non sigle. Es. "AVVISO PUBBLICO PER…".
 */
function trattiGridati(testo: string): Tratto[] {
  const tratti: Tratto[] = []
  let corrente: RegExpExecArray[] = []
  const chiudi = () => {
    const lunghe = corrente.filter((m) => gridata(m[0]) && lettere(m[0]).length >= 4).length
    if (corrente.length >= 3 && lunghe >= 2)
      tratti.push({ inizio: corrente[0].index, fine: corrente.at(-1)!.index, parole: corrente })
    corrente = []
  }
  for (const m of testo.matchAll(PAROLA)) {
    const pulita = m[0].replace(/\.+$/, '')
    if (pulita === pulita.toUpperCase() && !/\d/.test(pulita)) corrente.push(m)
    else chiudi()
  }
  chiudi()
  return tratti
}

/** Vero per un titolo quasi tutto maiuscolo o con un tratto gridato (tre o più parole). */
export function tuttoMaiuscolo(s: string | null | undefined): boolean {
  const testo = s ?? ''
  const l = lettere(testo)
  const maiuscole = l.replace(/[^\p{Lu}]/gu, '').length
  if (maiuscole >= 15 && maiuscole / l.length > 0.6) return true
  return trattiGridati(testo).length > 0
}

/** Validazione di Payload per i campi titolo. */
export const validaMaiuscole = (value: string | null | undefined): true | string =>
  !tuttoMaiuscolo(value) ||
  'Non scrivere il titolo (o parte del titolo) tutto in maiuscolo: usa la maiuscola solo all’inizio, per i nomi propri e le sigle.'

/**
 * Riscrive in minuscolo le parole maiuscole dei tratti gridati, con la maiuscola a inizio titolo,
 * dopo un trattino o i due punti e per i nomi propri. Sigle, codici e numeri romani restano.
 * I titoli senza tratti gridati restano uguali.
 */
export function inFrase(titolo: string): string {
  if (!tuttoMaiuscolo(titolo)) return titolo
  // Sul sito attuale la scadenza è spesso attaccata al titolo: "TORINOScadenza: …"
  const testo = titolo.replace(/(\p{Lu}{2,})(Scad(?:enza)?\.?:?)/gu, '$1 – $2')
  const l = lettere(testo)
  const tutto = l.replace(/[^\p{Lu}]/gu, '').length / l.length > 0.6
  const daRiscrivere = new Set<number>()
  if (tutto) {
    for (const m of testo.matchAll(PAROLA)) daRiscrivere.add(m.index)
  } else {
    for (const t of trattiGridati(testo)) for (const m of t.parole) daRiscrivere.add(m.index)
  }
  return testo.replace(PAROLA, (parola, indice: number) => {
    if (!daRiscrivere.has(indice) || !gridata(parola)) return parola
    const minuscola = parola.toLowerCase()
    const prima = testo.slice(0, indice).trimEnd()
    const aCapo = prima === '' || /[-–—:(“"«]$/.test(prima)
    return aCapo || NOMI.has(lettere(minuscola))
      ? minuscola.charAt(0).toUpperCase() + minuscola.slice(1)
      : minuscola
  })
}
