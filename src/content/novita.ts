/**
 * Registro delle novità della piattaforma, dal più recente.
 * Aggiungi una voce a ogni PR unita su main, in linguaggio semplice.
 */
export type Novita = {
  data: string // AAAA-MM-GG
  titolo: string
  punti: string[]
  pr: number[]
}

export const NOVITA: Novita[] = [
  {
    data: '2026-11-05',
    titolo: 'Header più fluido, titoli senza maiuscolo e ritocchi al pannello',
    punti: [
      'Scorrendo la pagina, la barra rossa e il logo si rimpiccioliscono senza scatti.',
      'I titoli tutti in maiuscolo non si possono più salvare; quelli importati dal sito attuale sono stati riscritti in minuscolo con l’iniziale maiuscola, tenendo le sigle.',
      'Nel pannello il percorso inizia con una casetta che porta alla bacheca, e in alto c’è il pulsante per aprire il sito.',
      'Il tema chiaro o scuro si sceglie dal proprio account, non più dall’intestazione.',
      'Corretti i due pulsanti di chiusura sovrapposti nel menu del pannello.',
    ],
    pr: [45],
  },
  {
    data: '2026-11-05',
    titolo: 'Pagine istituzionali dal sito attuale',
    punti: [
      'Importate 43 pagine del sito attuale: Accademia, Didattica, Studente, Dottorati con i profili dei dottorandi, Erasmus, Contatti, Open data, privacy e cookie.',
      'Gli indirizzi restano quelli di albertina-academy.it; le pagine Erasmus stanno sotto /erasmus e i vecchi indirizzi rimandano lì.',
      'I box “Scopri di più” verso le sottopagine sono diventati le schede automatiche delle sottopagine.',
      'Menu e footer puntano alle pagine vere.',
    ],
    pr: [44],
  },
  {
    data: '2026-11-05',
    titolo: 'Albo online e Amministrazione trasparente',
    punti: [
      'Albo online e Amministrazione trasparente sono nel pannello, nel gruppo “Uffici”: ufficio amministrativo, segreteria e vicedirezione pubblicano atti e documenti da soli.',
      'Importati dal sito attuale 413 atti dell’Albo con 1.100 documenti e le 94 sottosezioni della trasparenza con 571 documenti.',
      'Sul sito l’Albo si filtra per categoria e anno, si cerca per titolo e mostra in evidenza i bandi ancora aperti.',
      'Ogni sottosezione della trasparenza mostra la data dell’ultimo aggiornamento, che cambia da sola a ogni modifica.',
      'Le schede dei filtri degli avvisi hanno la sottolineatura scura invece che rossa.',
    ],
    pr: [43],
  },
  {
    data: '2026-11-05',
    titolo: 'Link a Orari e calendari',
    punti: [
      'Nel menu Didattica e nel footer la voce “Orari e calendari” porta alla nuova pagina /calendari.',
      'I vecchi indirizzi dell’orario lezioni e dei calendari rimandano alla nuova pagina.',
    ],
    pr: [42],
  },
  {
    data: '2026-11-05',
    titolo: 'Menu della sezione senza rosso',
    punti: [
      'Nel menu a destra delle pagine la voce corrente è su pannello azzurro chiaro con filetto scuro, al posto del rosso.',
    ],
    pr: [41],
  },
  {
    data: '2026-11-05',
    titolo: 'Presentazioni di scuole e corsi',
    punti: [
      'Importati dal PDF della segreteria i calendari delle presentazioni 2026/2027: scuole (11 righe) e corsi (201 righe).',
      'Si filtrano per scuola o corso e si cercano per docente, aula o data.',
    ],
    pr: [40],
  },
  {
    data: '2026-11-05',
    titolo: 'Orari e calendari a tabella',
    punti: [
      'Nuova sezione “Orari e calendari”: orario delle lezioni, esami e presentazioni si compilano a tabella nel pannello, anche incollando da Excel.',
      'Sul sito la tabella si filtra per livello, giorno e semestre, si legge a schede da telefono e si stampa con un clic.',
      'Importato l’orario delle lezioni 2025/2026 dal PDF della segreteria (462 righe).',
      'Box delle sottopagine e dei contatti a pannello pieno, senza bordi, come nella Vetrina tesi.',
    ],
    pr: [39],
  },
  {
    data: '2026-11-05',
    titolo: 'Pagine più curate',
    punti: [
      'Nuova testata delle pagine: occhiello rosso con la sezione, titolo grande e sommario, come nella Vetrina tesi.',
      'Contatti e menu della sezione nella colonna di destra; da telefono i contatti vanno subito sotto il titolo.',
      'Sottopagine in schede numerate con “Apri →”.',
      'Scheda docente con ritratto nella testata, contatti in riga e corsi in tabella.',
      'Tolto dai docenti un profilo cancellato dal sito attuale.',
    ],
    pr: [38],
  },
  {
    data: '2026-11-05',
    titolo: 'Pannello da telefono e accesso',
    punti: [
      'Da telefono il menu del pannello si apre come cassetto sopra la pagina, più stretto e con più spazio tra le voci.',
      'Pulsanti menu, tema e account della stessa misura, comodi da toccare.',
      'Pagina di accesso allineata a sinistra, con “Torna al sito” e logo che porta alla home.',
      'Card degli avvisi con “Leggi l’avviso →” e box delle sottopagine con “Apri →”.',
      'Nell’anteprima online si vedono di nuovo le immagini delle scuole.',
    ],
    pr: [37],
  },
  {
    data: '2026-11-04',
    titolo: 'Immagini e pagina 404',
    punti: [
      'Foto dei docenti caricate dal sito attuale.',
      'In homepage la sezione “Le scuole”, con le immagini di repertorio scelte per ogni scuola.',
      'Immagine di anteprima quando si condivide un link del sito.',
      'Nuova pagina 404 con ricerca e link alle pagine più utili.',
    ],
    pr: [36],
  },
  {
    data: '2026-11-04',
    titolo: 'Contenuti veri e rifiniture',
    punti: [
      'Importati i 1.077 avvisi del sito attuale, con gli stessi indirizzi e gli allegati come link.',
      'Pagina docente ordinata anche quando manca la biografia: contatti in alto, corsi in righe.',
      'Profili docenti dal sito attuale: biografie, orari di ricevimento e link al curriculum.',
      'Più aria tra le voci del menu del pannello.',
      'Icone del sito e della web app ricavate dallo stemma ufficiale; una sola ricerca nell’header.',
    ],
    pr: [33, 34],
  },
  {
    data: '2026-11-04',
    titolo: 'Revisione design, ciclo 2',
    punti: [
      'Pulsanti scuri al posto del rosso, etichette in maiuscoletto distinte dai pulsanti, filtri a schede.',
      'Barra superiore separata dall’header, che si compatta scorrendo; hero cangiante con controlli minimi.',
      'Pannello: icone nel menu, tema chiaro e scuro, uso comodo da telefono e come web app su iPhone.',
    ],
    pr: [31, 32],
  },
  {
    data: '2026-10-29',
    titolo: 'Revisione design, ciclo 1',
    punti: [
      'Indirizzi web e email negli avvisi diventano link cliccabili.',
      'Anteprime degli avvisi senza URL lunghi; date in italiano nel pannello.',
      'Aggiornate due librerie per chiudere avvisi di sicurezza.',
    ],
    pr: [29, 30],
  },
  {
    data: '2026-10-23',
    titolo: 'Corsi, docenti e anteprima online',
    punti: [
      'Catalogo corsi con scheda del corso e profili pubblici dei docenti; caricati i 267 corsi e 102 docenti attuali.',
      'Pannello rinnovato: dashboard con azioni rapide e stile Albertina.',
      'Header con etichette sotto le icone e menu a fisarmonica su telefono.',
      'Anteprima online protetta da password su Render.',
    ],
    pr: [13, 14, 15, 16, 17, 18],
  },
  {
    data: '2026-10-22',
    titolo: 'Header, footer e pagine',
    punti: [
      'Header con mega menu, slider degli avvisi in evidenza e box squadrati.',
      'Footer istituzionale con contatti e loghi MUR e AFAM.',
      'Pagine istituzionali composte a blocchi e menu del sito modificabile dal pannello.',
    ],
    pr: [8, 9, 10, 11, 12],
  },
  {
    data: '2026-10-21',
    titolo: 'Avvisi',
    punti: [
      'Avvisi con categorie per ruolo: ognuno pubblica solo nelle proprie.',
      'Pagina avvisi con filtri, pagina del singolo avviso e ultimi avvisi in homepage.',
    ],
    pr: [7],
  },
  {
    data: '2026-10-20',
    titolo: 'Fondamenta',
    punti: [
      'Nasce la piattaforma: Next.js, Payload CMS e PostgreSQL, con design system, test automatici e controlli di accessibilità.',
    ],
    pr: [1, 6],
  },
]
