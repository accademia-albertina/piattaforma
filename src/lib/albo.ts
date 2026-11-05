/**
 * Albo online e Amministrazione trasparente: sezioni e funzioni condivise tra pannello e sito.
 */

export const SEZIONI_ALBO = [
  'bandi-di-concorso',
  'bandi-generici',
  'bandi-di-gara',
  'sindacale',
] as const
export type SezioneAlbo = (typeof SEZIONI_ALBO)[number]

export const SEZIONE_ALBO: Record<SezioneAlbo, { titolo: string; sommario: string }> = {
  'bandi-di-concorso': {
    titolo: 'Bandi di concorso',
    sommario:
      'Docenti a contratto e in organico, personale tecnico-amministrativo, modelli viventi.',
  },
  'bandi-generici': {
    titolo: 'Bandi generici',
    sommario: 'Bandi per studenti, elezioni, coordinatori, Nucleo di valutazione.',
  },
  'bandi-di-gara': {
    titolo: 'Bandi di gara e avvisi',
    sommario:
      'Servizi, forniture, manutenzione, indagini di mercato e manifestazioni di interesse.',
  },
  sindacale: {
    titolo: 'Albo sindacale',
    sommario: 'Comunicazioni, assemblee, scioperi ed elezioni RSU.',
  },
}

/**
 * Sezioni dell'Amministrazione trasparente nell'ordine dell'allegato al D.Lgs. 33/2013,
 * più le informative del sito.
 */
export const SEZIONI_TRASPARENZA = [
  'Disposizioni generali',
  'Organizzazione',
  'Consulenti e collaboratori',
  'Personale',
  'Bandi di concorso',
  'Performance',
  'Enti controllati',
  'Attività e procedimenti',
  'Provvedimenti',
  'Controlli sulle imprese',
  'Bandi di gara e contratti',
  'Sovvenzioni, contributi, sussidi, vantaggi economici',
  'Bilanci',
  'Beni immobili e gestione patrimonio',
  'Controlli e rilievi sull’amministrazione',
  'Servizi erogati',
  'Pagamenti dell’amministrazione',
  'Opere pubbliche',
  'Pianificazione e governo del territorio',
  'Informazioni ambientali',
  'Strutture sanitarie private accreditate',
  'Interventi straordinari e di emergenza',
  'Altri contenuti',
  'Informative sito istituzionale',
] as const
export type SezioneTrasparenza = (typeof SEZIONI_TRASPARENZA)[number]

export type Documento = {
  nome: string
  url?: string | null
  file?: { url?: string | null; filesize?: number | null; mimeType?: string | null } | number | null
  nota?: string | null
}

/** Indirizzo del documento: il file caricato nel pannello o, in mancanza, il link. */
export function hrefDocumento(d: Documento): string | null {
  if (d.file && typeof d.file === 'object' && d.file.url) return d.file.url
  return d.url?.trim() || null
}

/** «PDF», «DOCX»… dall'indirizzo, per dire che cosa si scarica. */
export function formatoDocumento(href: string): string | null {
  const m = /\.([a-z0-9]{2,4})(?:[?#]|$)/i.exec(href)
  if (!m) return null
  const e = m[1].toLowerCase()
  return ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'odt', 'ods', 'zip', 'p7m'].includes(e)
    ? e.toUpperCase()
    : null
}

/** Un atto è in scadenza se ha una data di scadenza non ancora passata (fino a fine giornata). */
export function inCorso(scadenza: string | null | undefined, oggi = new Date()): boolean {
  if (!scadenza) return false
  const fine = new Date(scadenza)
  fine.setHours(23, 59, 59, 999)
  return fine >= oggi
}
