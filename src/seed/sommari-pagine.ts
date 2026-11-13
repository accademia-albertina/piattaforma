/**
 * Sommari delle pagine istituzionali importate dal sito attuale, che non ne avevano uno.
 * Il sommario compare sotto il titolo e nei box "In questa sezione" della pagina genitore.
 * Si scrive solo dove è vuoto: quelli scritti dalla redazione nel pannello restano.
 */
import type { Payload } from 'payload'

export const SOMMARI_PAGINE: Record<string, string> = {
  'accademia/albertina-press': 'La casa editrice dell’Accademia: cataloghi, saggi e libri d’artista dal 2013.',
  'accademia/biblioteca': 'Orari, accesso e consultazione del patrimonio librario.',
  'accademia/il-saluto-del-direttore': 'Il messaggio del Direttore a studenti, docenti e visitatori.',
  'accademia/ordinamento': 'Il ruolo delle Accademie di Belle Arti nel sistema AFAM.',
  'accademia/organigramma': 'Chi guida l’Accademia: organi di governo, direzione e uffici.',
  'accademia/storia-e-sedi': 'Dalla fondazione a oggi, e le sedi dove si studia e si lavora.',
  contatti: 'Indirizzi, telefoni ed email di segreteria, uffici e sedi.',
  'cookie-policy': 'Quali cookie usa il sito e come gestire le tue preferenze.',
  'didattica/manifesto-degli-studi':
    'Il documento annuale con corsi, regole, scadenze e contributi.',
  'dottorati/albertina': 'Il dottorato in Nuovi Media e Pratiche Critico-Curatoriali della Creazione Contemporanea.',
  'dottorati/convenzionati': 'Il Dottorato di Interesse Nazionale AFAM a cui partecipa l’Accademia.',
  erasmus: 'Studiare, insegnare e fare tirocinio all’estero con il programma Erasmus+.',
  'erasmus/bandi': 'Bandi aperti, scadenze e graduatorie per le mobilità Erasmus+.',
  'erasmus/incoming-students':
    'Information and history of the Academy for international students.',
  'erasmus/mobilita-docenti-staff': 'Mobilità per insegnamento e formazione di docenti e personale.',
  'erasmus/mobilita-studenti': 'Periodi di studio e tirocinio all’estero per gli studenti.',
  'open-data': 'I dati pubblici dell’Accademia in formato aperto e riutilizzabile.',
  'privacy-policy': 'Come l’Accademia tratta i dati personali raccolti dal sito.',
  'segnalazioni-di-accessibilita':
    'Come segnalare un problema di accessibilità del sito.',
  'studente/borse-di-studio': 'Borse EDISU Piemonte e altri aiuti allo studio.',
  'studente/consulta': 'L’organo che rappresenta gli studenti: componenti e contatti.',
  'studente/modulistica': 'Moduli per iscrizioni, tasse, esami, certificati ed Erasmus.',
  'studente/sportelli': 'Supporto accademico e personale, anche per studenti con disabilità o DSA.',
  'studente/stage-tirocinio': 'Stage e tirocini presso enti convenzionati, con i relativi crediti.',
  'studente/tasse': 'Importi, scadenze ed esoneri dei contributi di iscrizione.',
  'studente/tesi': 'Domanda di tesi, scadenze e sessioni di laurea.',
  'studente/tutoraggio-interculturale':
    'Supporto, ascolto e integrazione per studenti internazionali.',
  'termini-e-condizioni': 'Le condizioni d’uso del sito dell’Accademia.',
}

export async function completaSommariPagine(payload: Payload) {
  const { docs } = await payload.find({
    collection: 'pagine',
    where: { percorso: { in: Object.keys(SOMMARI_PAGINE) } },
    pagination: false,
    depth: 0,
    select: { percorso: true, sommario: true },
    overrideAccess: true,
  })
  let scritti = 0
  for (const d of docs) {
    if (d.sommario?.trim() || !d.percorso) continue
    await payload.update({
      collection: 'pagine',
      id: d.id,
      data: { sommario: SOMMARI_PAGINE[d.percorso] },
      context: { importazione: true },
      overrideAccess: true,
    })
    scritti++
  }
  if (scritti) payload.logger.info(`Sommari delle pagine completati: ${scritti}.`)
}
