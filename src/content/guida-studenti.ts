/**
 * Guida breve per gli studenti, in fondo a “La mia area”. Testi semplici, nomi dei pulsanti
 * come compaiono sul sito. Gli studenti non entrano nel pannello: tutto avviene sul sito.
 */
export type VoceGuidaStudenti = { id: string; titolo: string; passi: string[] }

export const LINK_ISIDATA = 'https://servizi13.isidata.net/SSDidatticheAC/MainGeneraleRes.aspx'

export const GUIDA_STUDENTI: VoceGuidaStudenti[] = [
  {
    id: 'accesso',
    titolo: 'Accedere',
    passi: [
      'Premi “Accedi” in alto a destra e scegli “Accedi con Google” con il tuo account istituzionale (12345t@ per il triennio, 12345b@ per il biennio).',
      'Una volta dentro, in alto a destra compaiono le tue iniziali: da lì apri “La mia area” o esci.',
      'Se non ricordi la password dell’account Google, recuperala dalla mail di benvenuto o dalla pagina di Google: il sito usa lo stesso account.',
    ],
  },
  {
    id: 'iscriversi',
    titolo: 'Iscriversi a un corso',
    passi: [
      'Apri il corso da “Corsi” (puoi filtrare per scuola e livello).',
      'Nel riquadro “Iscrizione al corso” trovi le date: se le iscrizioni sono aperte premi “Iscriviti al corso”.',
      'Puoi iscriverti solo ai corsi del tuo livello. L’iscrizione compare subito qui, in “La mia area”.',
    ],
  },
  {
    id: 'annullare',
    titolo: 'Annullare un’iscrizione',
    passi: [
      'Finché le iscrizioni sono aperte premi “Annulla l’iscrizione” (qui o nella pagina del corso) e conferma.',
      'Dopo la chiusura non si annulla più dal sito: scrivi alla segreteria didattica.',
    ],
  },
  {
    id: 'esami',
    titolo: 'Iscriversi a un esame',
    passi: [
      'Apri “Esami e iscrizioni” (da “Orari e calendari”) o la pagina del corso: trovi gli appelli con data, ora, aula e commissione.',
      'Premi “Iscriviti all’appello” mentre le iscrizioni della sessione sono aperte; chiudono comunque alle 23:59 del giorno prima dell’esame.',
      'Per ogni corso puoi essere iscritto a un solo appello per sessione: per cambiarlo annulla prima l’iscrizione.',
      'Gli esami a cui sei iscritto compaiono qui, in “I tuoi esami”.',
    ],
  },
  {
    id: 'date',
    titolo: 'Quando ci si iscrive',
    passi: [
      'La segreteria apre le iscrizioni ai corsi una volta per semestre (i corsi annuali seguono il primo) e quelle agli esami per ogni sessione: invernale (febbraio), estiva (giugno) e autunnale (settembre).',
      'Il docente può tenere aperte più a lungo le iscrizioni al proprio corso o appello: fa fede la data mostrata sul sito.',
    ],
  },
  {
    id: 'isidata',
    titolo: 'Carriera, tasse e piano di studi',
    passi: [
      'Carriera, tasse, piano di studi e verbali restano su Isidata, che ha un accesso separato.',
    ],
  },
]
