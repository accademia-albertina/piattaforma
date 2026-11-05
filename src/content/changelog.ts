/**
 * Registro delle versioni della piattaforma (changelog), dalla più recente.
 * Si vede solo nel pannello, in /admin/changelog.
 *
 * Aggiungi una versione a ogni PR unita su main:
 * - con almeno una voce "nuovo" sale il numero centrale (0.15.0 → 0.16.0);
 * - con sole voci "migliorato" o "corretto" sale l'ultimo (0.16.0 → 0.16.1);
 * - la 1.0.0 sarà la messa online al posto del sito attuale.
 * Testi brevi, in linguaggio semplice: li leggono gli admin, non gli sviluppatori.
 */
export const TIPI_VOCE = ['nuovo', 'migliorato', 'corretto'] as const
export type TipoVoce = (typeof TIPI_VOCE)[number]

export const ETICHETTE_TIPO: Record<TipoVoce, string> = {
  nuovo: 'Nuovo',
  migliorato: 'Migliorato',
  corretto: 'Corretto',
}

export type Versione = {
  versione: string // x.y.z
  data: string // AAAA-MM-GG
  titolo: string
  voci: { tipo: TipoVoce; testo: string }[]
  pr: number[]
}

export const CHANGELOG: Versione[] = [
  {
    versione: '0.17.0',
    data: '2026-11-05',
    titolo: 'Vedi sul sito e ritocchi',
    voci: [
      {
        tipo: 'nuovo',
        testo:
          'Nel pannello, pagine, avvisi, corsi, docenti, dottorandi, calendari e trasparenza hanno in alto a destra il pulsante “Vedi sul sito”.',
      },
      {
        tipo: 'migliorato',
        testo:
          'Gli avvisi in evidenza senza foto mostrano un’immagine di repertorio: quella della scuola, o una delle sedi.',
      },
      {
        tipo: 'migliorato',
        testo:
          'I box “In questa sezione” delle pagine genitore hanno una breve descrizione, presa dal sommario della pagina.',
      },
      {
        tipo: 'migliorato',
        testo:
          'Nel pannello le icone del sito e dell’account sono più leggere e senza riquadro; la casetta del percorso è allineata al testo.',
      },
      { tipo: 'corretto', testo: 'Il menu laterale delle pagine non finisce più sotto l’intestazione.' },
      { tipo: 'corretto', testo: 'Nella pagina Docenti le linee delle lettere non sono più rosse.' },
    ],
    pr: [48],
  },
  {
    versione: '0.16.0',
    data: '2026-11-05',
    titolo: 'Dottorandi',
    voci: [
      {
        tipo: 'nuovo',
        testo:
          'Sezione Dottorandi nel pannello, come i docenti: foto, ciclo, curriculum, supervisor, progetto di ricerca e biografia.',
      },
      {
        tipo: 'nuovo',
        testo:
          'La pagina Dottorandi mostra i profili a schede, raggruppati per ciclo quando è indicato; ogni scheda porta al profilo completo.',
      },
      {
        tipo: 'nuovo',
        testo:
          'Importati dal sito attuale i 13 profili, con progetto, abstract, supervisor e co-supervisor separati dal testo.',
      },
      {
        tipo: 'nuovo',
        testo:
          'Ogni dottorando con un account aggiorna il proprio profilo; ciclo, nome e supervisor li gestisce la vicedirezione.',
      },
    ],
    pr: [46],
  },
  {
    versione: '0.15.0',
    data: '2026-11-05',
    titolo: 'Titoli senza maiuscolo e ritocchi al pannello',
    voci: [
      {
        tipo: 'nuovo',
        testo:
          'In tutte le sezioni non si possono più salvare titoli scritti tutti in maiuscolo; le sigle (AFAM, MUR, CFA…) restano maiuscole.',
      },
      {
        tipo: 'migliorato',
        testo:
          'I titoli in maiuscolo importati dal sito attuale (avvisi, albo, trasparenza, corsi) sono stati riscritti in minuscolo.',
      },
      {
        tipo: 'migliorato',
        testo:
          'Nel pannello il tema chiaro/scuro si sceglie dal proprio account; in alto c’è l’icona per aprire il sito e nel percorso una casetta per tornare alla bacheca.',
      },
      {
        tipo: 'corretto',
        testo: 'L’intestazione del sito si riduce in modo fluido durante lo scorrimento.',
      },
      { tipo: 'corretto', testo: 'Nel menu del pannello su mobile non compaiono più due X.' },
    ],
    pr: [45],
  },
  {
    versione: '0.14.0',
    data: '2026-11-05',
    titolo: 'Pagine istituzionali dal sito attuale',
    voci: [
      {
        tipo: 'nuovo',
        testo:
          'Importate le pagine del sito attuale: Accademia, Didattica, Studente, Dottorati, Erasmus, Contatti, Open data, privacy e cookie.',
      },
      {
        tipo: 'migliorato',
        testo:
          'Gli indirizzi restano quelli di albertina-academy.it; le pagine Erasmus stanno sotto /erasmus e i vecchi indirizzi rimandano lì.',
      },
      {
        tipo: 'migliorato',
        testo:
          'I box “Scopri di più” verso le sottopagine sono diventati le schede automatiche delle sottopagine.',
      },
      { tipo: 'corretto', testo: 'Menu e footer puntano alle pagine vere.' },
    ],
    pr: [44],
  },
  {
    versione: '0.13.0',
    data: '2026-11-05',
    titolo: 'Albo online e Amministrazione trasparente',
    voci: [
      {
        tipo: 'nuovo',
        testo:
          'Albo online e Amministrazione trasparente nel pannello, nel gruppo “Uffici”: ufficio amministrativo, segreteria e vicedirezione pubblicano atti e documenti da soli.',
      },
      {
        tipo: 'nuovo',
        testo:
          'Importati dal sito attuale 413 atti dell’Albo con 1.100 documenti e le 94 sottosezioni della trasparenza con 571 documenti.',
      },
      {
        tipo: 'nuovo',
        testo:
          'Sul sito l’Albo si filtra per categoria e anno, si cerca per titolo e mostra in evidenza i bandi ancora aperti.',
      },
      {
        tipo: 'nuovo',
        testo:
          'Ogni sottosezione della trasparenza mostra la data dell’ultimo aggiornamento, che cambia da sola a ogni modifica.',
      },
      {
        tipo: 'migliorato',
        testo: 'Le schede dei filtri degli avvisi hanno la sottolineatura scura invece che rossa.',
      },
    ],
    pr: [43],
  },
  {
    versione: '0.12.2',
    data: '2026-11-05',
    titolo: 'Link a Orari e calendari',
    voci: [
      {
        tipo: 'migliorato',
        testo: 'Nel menu Didattica e nel footer la voce “Orari e calendari” porta alla pagina /calendari.',
      },
      {
        tipo: 'migliorato',
        testo: 'I vecchi indirizzi dell’orario lezioni e dei calendari rimandano alla nuova pagina.',
      },
    ],
    pr: [42],
  },
  {
    versione: '0.12.1',
    data: '2026-11-05',
    titolo: 'Menu della sezione senza rosso',
    voci: [
      {
        tipo: 'migliorato',
        testo:
          'Nel menu a destra delle pagine la voce corrente è su pannello azzurro chiaro con filetto scuro, al posto del rosso.',
      },
    ],
    pr: [41],
  },
  {
    versione: '0.12.0',
    data: '2026-11-05',
    titolo: 'Presentazioni di scuole e corsi',
    voci: [
      {
        tipo: 'nuovo',
        testo:
          'Importati dal PDF della segreteria i calendari delle presentazioni 2026/2027: scuole (11 righe) e corsi (201 righe).',
      },
      { tipo: 'nuovo', testo: 'Si filtrano per scuola o corso e si cercano per docente, aula o data.' },
    ],
    pr: [40],
  },
  {
    versione: '0.11.0',
    data: '2026-11-05',
    titolo: 'Orari e calendari a tabella',
    voci: [
      {
        tipo: 'nuovo',
        testo:
          'Sezione “Orari e calendari”: orario delle lezioni, esami e presentazioni si compilano a tabella nel pannello, anche incollando da Excel.',
      },
      {
        tipo: 'nuovo',
        testo:
          'Sul sito la tabella si filtra per livello, giorno e semestre, si legge a schede da telefono e si stampa con un clic.',
      },
      {
        tipo: 'nuovo',
        testo: 'Importato l’orario delle lezioni 2025/2026 dal PDF della segreteria (462 righe).',
      },
      {
        tipo: 'migliorato',
        testo:
          'Box delle sottopagine e dei contatti a pannello pieno, senza bordi, come nella Vetrina tesi.',
      },
    ],
    pr: [39],
  },
  {
    versione: '0.10.0',
    data: '2026-11-05',
    titolo: 'Pagine più curate',
    voci: [
      {
        tipo: 'nuovo',
        testo:
          'Testata delle pagine con occhiello, titolo grande e sommario, come nella Vetrina tesi.',
      },
      {
        tipo: 'migliorato',
        testo:
          'Contatti e menu della sezione nella colonna di destra; da telefono i contatti vanno subito sotto il titolo.',
      },
      { tipo: 'migliorato', testo: 'Sottopagine in schede con “Apri →”.' },
      {
        tipo: 'migliorato',
        testo: 'Scheda docente con ritratto nella testata, contatti in riga e corsi in tabella.',
      },
      { tipo: 'corretto', testo: 'Tolto dai docenti un profilo cancellato dal sito attuale.' },
    ],
    pr: [38],
  },
  {
    versione: '0.9.0',
    data: '2026-11-05',
    titolo: 'Pannello da telefono e accesso',
    voci: [
      {
        tipo: 'nuovo',
        testo:
          'Da telefono il menu del pannello si apre come cassetto sopra la pagina, più stretto e con più spazio tra le voci.',
      },
      { tipo: 'migliorato', testo: 'Pulsanti dell’intestazione della stessa misura, comodi da toccare.' },
      {
        tipo: 'migliorato',
        testo:
          'Pagina di accesso allineata a sinistra, con “Torna al sito” e logo che porta alla home.',
      },
      {
        tipo: 'migliorato',
        testo: 'Card degli avvisi con “Leggi l’avviso →” e box delle sottopagine con “Apri →”.',
      },
      {
        tipo: 'corretto',
        testo: 'Nell’anteprima online si vedono di nuovo le immagini delle scuole.',
      },
    ],
    pr: [37],
  },
  {
    versione: '0.8.0',
    data: '2026-11-04',
    titolo: 'Immagini e pagina 404',
    voci: [
      { tipo: 'nuovo', testo: 'Foto dei docenti caricate dal sito attuale.' },
      {
        tipo: 'nuovo',
        testo:
          'In homepage la sezione “Le scuole”, con le immagini di repertorio scelte per ogni scuola.',
      },
      { tipo: 'nuovo', testo: 'Immagine di anteprima quando si condivide un link del sito.' },
      { tipo: 'nuovo', testo: 'Pagina 404 con ricerca e link alle pagine più utili.' },
    ],
    pr: [36],
  },
  {
    versione: '0.7.0',
    data: '2026-11-04',
    titolo: 'Contenuti veri e rifiniture',
    voci: [
      {
        tipo: 'nuovo',
        testo:
          'Importati i 1.077 avvisi del sito attuale, con gli stessi indirizzi e gli allegati come link.',
      },
      {
        tipo: 'nuovo',
        testo:
          'Profili docenti dal sito attuale: biografie, orari di ricevimento e link al curriculum.',
      },
      {
        tipo: 'migliorato',
        testo:
          'Pagina docente ordinata anche quando manca la biografia: contatti in alto, corsi in righe.',
      },
      { tipo: 'migliorato', testo: 'Più aria tra le voci del menu del pannello.' },
      {
        tipo: 'migliorato',
        testo:
          'Icone del sito e della web app ricavate dallo stemma ufficiale; una sola ricerca nell’header.',
      },
    ],
    pr: [33, 34],
  },
  {
    versione: '0.6.0',
    data: '2026-11-04',
    titolo: 'Revisione design, ciclo 2',
    voci: [
      {
        tipo: 'migliorato',
        testo:
          'Pulsanti scuri al posto del rosso, etichette in maiuscoletto distinte dai pulsanti, filtri a schede.',
      },
      {
        tipo: 'migliorato',
        testo:
          'Barra superiore separata dall’header, che si compatta scorrendo; hero con controlli minimi.',
      },
      {
        tipo: 'nuovo',
        testo:
          'Pannello con icone nel menu, tema chiaro e scuro, uso comodo da telefono e come web app su iPhone.',
      },
    ],
    pr: [31, 32],
  },
  {
    versione: '0.5.0',
    data: '2026-10-29',
    titolo: 'Revisione design, ciclo 1',
    voci: [
      { tipo: 'nuovo', testo: 'Indirizzi web e email negli avvisi diventano link cliccabili.' },
      {
        tipo: 'migliorato',
        testo: 'Anteprime degli avvisi senza URL lunghi; date in italiano nel pannello.',
      },
      { tipo: 'corretto', testo: 'Aggiornate due librerie per chiudere avvisi di sicurezza.' },
    ],
    pr: [29, 30],
  },
  {
    versione: '0.4.0',
    data: '2026-10-23',
    titolo: 'Corsi, docenti e anteprima online',
    voci: [
      {
        tipo: 'nuovo',
        testo:
          'Catalogo corsi con scheda del corso e profili pubblici dei docenti; caricati i 267 corsi e 102 docenti attuali.',
      },
      { tipo: 'migliorato', testo: 'Pannello rinnovato: bacheca con azioni rapide e stile Albertina.' },
      {
        tipo: 'migliorato',
        testo: 'Header con etichette sotto le icone e menu a fisarmonica su telefono.',
      },
      { tipo: 'nuovo', testo: 'Anteprima online protetta da password.' },
    ],
    pr: [13, 14, 15, 16, 17, 18],
  },
  {
    versione: '0.3.0',
    data: '2026-10-22',
    titolo: 'Header, footer e pagine',
    voci: [
      {
        tipo: 'nuovo',
        testo: 'Header con mega menu, slider degli avvisi in evidenza e box squadrati.',
      },
      { tipo: 'nuovo', testo: 'Footer istituzionale con contatti e loghi MUR e AFAM.' },
      {
        tipo: 'nuovo',
        testo:
          'Pagine istituzionali composte a blocchi e menu del sito modificabile dal pannello.',
      },
    ],
    pr: [8, 9, 10, 11, 12],
  },
  {
    versione: '0.2.0',
    data: '2026-10-21',
    titolo: 'Avvisi',
    voci: [
      { tipo: 'nuovo', testo: 'Avvisi con categorie per ruolo: ognuno pubblica solo nelle proprie.' },
      {
        tipo: 'nuovo',
        testo: 'Pagina avvisi con filtri, pagina del singolo avviso e ultimi avvisi in homepage.',
      },
    ],
    pr: [7],
  },
  {
    versione: '0.1.0',
    data: '2026-10-20',
    titolo: 'Fondamenta',
    voci: [
      {
        tipo: 'nuovo',
        testo:
          'Nasce la piattaforma: Next.js, Payload CMS e PostgreSQL, con design system, test automatici e controlli di accessibilità.',
      },
    ],
    pr: [1, 6],
  },
]
