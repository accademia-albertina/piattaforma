/**
 * Terminologia dei titoli AFAM (DL PA, agosto 2026): il diploma accademico di primo livello
 * diventa «Laurea», quello di secondo livello «Laurea Magistrale».
 * Usata dalla migrazione dei testi delle scuole e per rigenerare il seed.
 * Non tocca le lauree universitarie («Laurea di Primo Livello in Lettere») né il diploma di scuola
 * secondaria; i titoli già conseguiti citati nei requisiti («diplomi di 1° livello») restano.
 */

const DIPLOMA = String.raw`[Dd]iploma(?:\s+[Aa]ccademico)?\s+di`
const PRIMO = String.raw`(?:[Pp]rimo|I|1°)`
const SECONDO = String.raw`(?:[Ss]econdo|II|2°)`
const LIVELLO = String.raw`[Ll]ivello`

const titolo = (l: string) => String.raw`${DIPLOMA}\s+${l}\s+${LIVELLO}`
const T1 = titolo(PRIMO)
const T2 = titolo(SECONDO)

type Regola = [RegExp, string]

const REGOLE: Regola[] = [
  // Frasi intere, prima delle sostituzioni generiche
  [new RegExp(String.raw`[Cc]orso di ${T2}`, 'g'), 'Corso di Laurea Magistrale'],
  [new RegExp(String.raw`percorso di ${T1}`, 'g'), 'percorso di Laurea'],
  [
    /in possesso di un Diploma Accademico o di una Laurea di I Livello/g,
    'in possesso di una Laurea accademica o universitaria',
  ],
  [/Corso di secondo livello/g, 'Corso di Laurea Magistrale'],
  [new RegExp(String.raw`Il ${T2} viene conseguito`, 'g'), 'La Laurea Magistrale viene conseguita'],
  // Articoli e preposizioni concordati al femminile
  [new RegExp(String.raw`\bdel ${T1}`, 'g'), 'della Laurea'],
  [new RegExp(String.raw`\bdel ${T2}`, 'g'), 'della Laurea Magistrale'],
  [new RegExp(String.raw`\bil ${T1}`, 'g'), 'la Laurea'],
  [new RegExp(String.raw`\bil ${T2}`, 'g'), 'la Laurea Magistrale'],
  [new RegExp(String.raw`\bIl ${T1}`, 'g'), 'La Laurea'],
  [new RegExp(String.raw`\bIl ${T2}`, 'g'), 'La Laurea Magistrale'],
  [new RegExp(String.raw`\bun ${T1}`, 'g'), 'una Laurea'],
  [new RegExp(String.raw`\bun ${T2}`, 'g'), 'una Laurea Magistrale'],
  // Il resto
  [new RegExp(T1, 'g'), 'Laurea'],
  [new RegExp(T2, 'g'), 'Laurea Magistrale'],
  // Persone e corsi
  [/\bcorsi di diploma\b/g, 'corsi di laurea'],
  [/\bI Diplomati\b/g, 'I laureati'],
  [/\bI diplomati\b/g, 'I laureati'],
  [/\bi diplomati\b/g, 'i laureati'],
  [/\bdei diplomati\b/g, 'dei laureati'],
  [/\bil diplomato\b/g, 'il laureato'],
  // «Laurea Magistrale di Decorazione» → «in Decorazione» (non «Laurea di Primo Livello» universitaria)
  [/\b(Laurea(?: Magistrale)?) di (?!(?:Primo|Secondo|I|II)\b)(?=["“A-Z])/g, '$1 in '],
]

/** Aggiorna un testo. `livello` serve per «Il diploma viene conseguito» senza altro contesto. */
export function aggiornaTerminologia(testo: string, livello?: 'triennio' | 'biennio'): string {
  let t = testo
  for (const [re, sost] of REGOLE) t = t.replace(re, sost)
  if (livello) {
    t = t.replace(
      /\bIl diploma viene conseguito/g,
      livello === 'biennio'
        ? 'La Laurea Magistrale viene conseguita'
        : 'La Laurea viene conseguita',
    )
  }
  return t
}

/** Applica la sostituzione a tutti i nodi di testo di uno stato Lexical (o a qualsiasi JSON). */
export function aggiornaTerminologiaLexical<T>(valore: T, livello?: 'triennio' | 'biennio'): T {
  const visita = (v: unknown): unknown => {
    if (Array.isArray(v)) return v.map(visita)
    if (v && typeof v === 'object') {
      const o = v as Record<string, unknown>
      const nuovo: Record<string, unknown> = {}
      for (const [k, x] of Object.entries(o)) {
        nuovo[k] =
          k === 'text' && typeof x === 'string' ? aggiornaTerminologia(x, livello) : visita(x)
      }
      return nuovo
    }
    return v
  }
  return visita(valore) as T
}

/**
 * «Laurea» e «Laurea Magistrale» sempre con la maiuscola (Fede, 2026-11-18) e, dove si parla dei
 * due livelli, (Triennio) e (Biennio) tra parentesi, come li chiamano ancora gli studenti.
 * Non tocca indirizzi (…/tesi-di-laurea/), lauree universitarie e «post laurea».
 */
const MAIUSCOLE: Regola[] = [
  // Frasi dei testi scritti per il nuovo sito (Assistenza, Open Days, sommari)
  [/studenti della [Ll]aurea:/g, 'studenti della Laurea (Triennio):'],
  [/studenti della [Ll]aurea [Mm]agistrale:/g, 'studenti della Laurea Magistrale (Biennio):'],
  [
    /alla [Ll]aurea o alla [Ll]aurea [Mm]agistrale\b/g,
    'alla Laurea (Triennio) o alla Laurea Magistrale (Biennio)',
  ],
  [/corsi di Triennio e Biennio/g, 'corsi di Laurea (Triennio) e Laurea Magistrale (Biennio)'],
  [/(?<![\w/_-])[Ll]aurea [Mm]agistrale\b/g, 'Laurea Magistrale'],
  [/(?<![\w/_-])[Ll]auree [Mm]agistrali\b/g, 'Lauree Magistrali'],
  [/(?<![\w/_-]|post[ -])laurea\b(?![ -]?universitar|[/_-])/g, 'Laurea'],
  [/(?<![\w/_-]|post[ -])lauree\b(?![ -]?universitar|[/_-])/g, 'Lauree'],
]

export function maiuscoleLauree(testo: string): string {
  let t = testo
  for (const [re, sost] of MAIUSCOLE) t = t.replace(re, sost)
  return t
}

/** Come maiuscoleLauree, sui nodi di testo di uno stato Lexical (o di qualsiasi JSON). */
export function maiuscoleLaureeLexical<T>(valore: T): T {
  const visita = (v: unknown): unknown => {
    if (Array.isArray(v)) return v.map(visita)
    if (v && typeof v === 'object') {
      const nuovo: Record<string, unknown> = {}
      for (const [k, x] of Object.entries(v as Record<string, unknown>)) {
        nuovo[k] = k === 'text' && typeof x === 'string' ? maiuscoleLauree(x) : visita(x)
      }
      return nuovo
    }
    return v
  }
  return visita(valore) as T
}
