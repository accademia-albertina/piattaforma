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
    versione: '0.35.1',
    data: '2026-11-13',
    titolo: 'Coordinatori senza preposizione',
    voci: [
      {
        tipo: 'corretto',
        testo:
          'Nella pagina della scuola si legge “Coordinatore dipartimento” e “Coordinatore scuola”.',
      },
    ],
    pr: [],
  },
  {
    versione: '0.35.0',
    data: '2026-11-13',
    titolo: 'Email del sito e registro degli invii',
    voci: [
      {
        tipo: 'nuovo',
        testo:
          'Le conferme di iscrizione a corsi ed esami partono davvero, con una grafica nei colori dell’Accademia: logo, riquadro con i dati e pulsante per La mia area.',
      },
      {
        tipo: 'nuovo',
        testo:
          'Sezione “Email inviate” (solo amministratori): ogni email spedita dal sito con destinatario, oggetto ed esito. Le voci si cancellano da sole dopo 30 giorni.',
      },
      {
        tipo: 'nuovo',
        testo:
          'Limite di dimensione dei file caricati: 20 MB per le immagini e 10 MB per i PDF. Gli amministratori possono caricare fino a 50 MB.',
      },
      {
        tipo: 'corretto',
        testo:
          'I file più grandi di 10 MB non davano più “Something went wrong” al salvataggio: ora entrano (entro il limite) o compare un messaggio chiaro.',
      },
    ],
    pr: [],
  },
  {
    versione: '0.34.0',
    data: '2026-11-13',
    titolo: 'Rifiniture dopo i feedback: lauree, docenti, stampa e orario',
    voci: [
      {
        tipo: 'nuovo',
        testo:
          'Pulsante “Torna su” in tutte le pagine e intestazione dell’Accademia (stemma e contatti) quando si stampa una pagina, come l’orario.',
      },
      {
        tipo: 'nuovo',
        testo:
          'Orario a tabella: nella colonna dei docenti compaiono i nomi mentre scrivi, e le ore si scelgono con il selettore.',
      },
      {
        tipo: 'migliorato',
        testo:
          'Nuovi nomi dei titoli: Laurea e Laurea magistrale al posto dei diplomi accademici di primo e secondo livello, anche nelle schede delle scuole.',
      },
      {
        tipo: 'migliorato',
        testo:
          'Docenti: legenda tra scuola di afferenza principale e pro-afferenze (la prima scuola del profilo è la principale); nella pagina del docente si clicca tutta la riga del corso.',
      },
      {
        tipo: 'migliorato',
        testo:
          'Testo base a 16 px, titoli più contenuti, pagine più larghe, nuovo effetto sui pulsanti dell’header; fino a 6 avvisi nella pagina della scuola; Albertina Press con la presentazione prima del catalogo; i PDF si aprono in una nuova scheda.',
      },
      {
        tipo: 'corretto',
        testo: 'La pagina non salta più di lato quando si apre il menu su Chrome.',
      },
    ],
    pr: [82],
  },
  {
    versione: '0.33.1',
    data: '2026-11-13',
    titolo: 'Spostamento su Drive senza interruzioni',
    voci: [
      {
        tipo: 'corretto',
        testo:
          '“Sposta su Drive” non blocca più il sito con i file grandi: ogni file viene inviato a pezzi da 8 MB.',
      },
    ],
    pr: [],
  },
  {
    versione: '0.33.0',
    data: '2026-11-13',
    titolo: 'File su Google Drive',
    voci: [
      {
        tipo: 'nuovo',
        testo:
          'Le immagini e i PDF caricati nel pannello si salvano nella cartella Google Drive dell’Accademia. Gli amministratori collegano Drive una volta da “Google Drive” nella dashboard.',
      },
      {
        tipo: 'nuovo',
        testo:
          'Il sito tiene una copia veloce dei file di Drive: le pagine si aprono rapide anche con molti visitatori.',
      },
      {
        tipo: 'nuovo',
        testo: 'Pulsante “Sposta su Drive” per trasferire i file caricati prima del collegamento.',
      },
    ],
    pr: [],
  },
  {
    versione: '0.32.1',
    data: '2026-11-10',
    titolo: 'Virtual tour con la facciata',
    voci: [
      {
        tipo: 'migliorato',
        testo:
          'L’invito al virtual tour in fondo alla home ha come sfondo la facciata di via Accademia Albertina, una foto più nitida a tutto schermo.',
      },
    ],
    pr: [78],
  },
  {
    versione: '0.32.0',
    data: '2026-11-10',
    titolo: 'Home: da dove vuoi iniziare',
    voci: [
      {
        tipo: 'nuovo',
        testo:
          'Sotto lo slider della home c’è una fascia “Da dove vuoi iniziare?” con quattro accessi diretti: Ammissioni, Offerta formativa, Orari e calendari, Segreteria didattica.',
      },
      {
        tipo: 'migliorato',
        testo:
          'Il motto “J’attends mon astre” compare appena la sezione entra nello schermo. L’invito al virtual tour ha come sfondo la Rotonda del Talucchi; la foto della pinacoteca torna tra quelle usate per gli avvisi senza immagine.',
      },
    ],
    pr: [77],
  },
  {
    versione: '0.31.2',
    data: '2026-11-10',
    titolo: 'Codice aperto con licenza EUPL 1.2',
    voci: [
      {
        tipo: 'migliorato',
        testo:
          'Il codice della piattaforma diventa open source con licenza EUPL 1.2, come chiede il CAD alla pubblica amministrazione. Loghi, foto e contenuti dell’Accademia restano esclusi. Nessun cambiamento visibile.',
      },
    ],
    pr: [65],
  },
  {
    versione: '0.31.1',
    data: '2026-11-07',
    titolo: 'Librerie aggiornate',
    voci: [
      {
        tipo: 'migliorato',
        testo:
          'Aggiornati i componenti su cui si basa la piattaforma (pannello, sito e strumenti di verifica) alle versioni più recenti, con le ultime correzioni di sicurezza. Nessun cambiamento visibile.',
      },
    ],
    pr: [64],
  },
  {
    versione: '0.31.0',
    data: '2026-11-07',
    titolo: 'Nuova home: motto animato, avvisi in un solo blocco, virtual tour',
    voci: [
      {
        tipo: 'nuovo',
        testo:
          'Sotto lo slider c’è una sezione animata: il motto “J’attends mon astre” in corsivo sale lettera per lettera sulla foto dello scalone d’onore, poi un breve testo si accende parola per parola e le cifre dell’Accademia contano fino al loro valore. Da telefono gli effetti sono più leggeri; con “riduci movimento” è tutto fermo.',
      },
      {
        tipo: 'migliorato',
        testo:
          'Gli ultimi avvisi in home stanno in un solo blocco con le schede Tutti, Lezioni ed esami, Bandi e concorsi.',
      },
      {
        tipo: 'nuovo',
        testo:
          'La home si chiude con “Esplora l’Accademia”, l’invito al virtual tour a tutta larghezza sulla foto della pinacoteca.',
      },
    ],
    pr: [62],
  },
  {
    versione: '0.30.0',
    data: '2026-11-07',
    titolo: 'Guida del pannello con le schermate',
    voci: [
      {
        tipo: 'nuovo',
        testo:
          'Ogni voce della Guida ha una schermata vera del pannello, con riquadri numerati sugli stessi punti dei passi; si vede chiara o scura come il tema scelto.',
      },
      {
        tipo: 'migliorato',
        testo:
          'Passando sopra un passo si evidenzia il suo riquadro; un clic sulla schermata la apre a grandezza piena.',
      },
      {
        tipo: 'migliorato',
        testo: 'Per gli amministratori “Vedi come” è diventato una fila di schede, una per ruolo.',
      },
    ],
    pr: [63],
  },
  {
    versione: '0.29.0',
    data: '2026-11-07',
    titolo: 'Menu del pannello più chiaro e ritocchi alla home',
    voci: [
      {
        tipo: 'nuovo',
        testo:
          'In fondo al menu del pannello ci sono “Guida” ed “Esci”, con testo e icona; il punto di domanda in alto è stato tolto.',
      },
      {
        tipo: 'migliorato',
        testo:
          'Finestre di iscrizione, iscrizioni ai corsi, appelli e iscrizioni agli esami stanno insieme nel gruppo “Iscrizioni ed esami”.',
      },
      {
        tipo: 'migliorato',
        testo:
          'Pagina iniziale del pannello: le sezioni sono divise come nel menu e ogni scheda ha “+ Nuovo …”; in alto restano solo le azioni più frequenti.',
      },
      {
        tipo: 'migliorato',
        testo:
          'Sito: “Le scuole” in home porta all’offerta formativa, comandi dello slider più compatti, titolo degli avvisi più piccolo, copertina delle scuole più grande da telefono.',
      },
      {
        tipo: 'migliorato',
        testo: 'Anche i docenti vedono il changelog, dalla pagina iniziale del pannello.',
      },
      {
        tipo: 'corretto',
        testo:
          '“Accedi” mostra di nuovo la pagina di accesso prima di Google e, dopo l’accesso, si torna al pannello. Nella Guida e nel Changelog la casetta del percorso è di nuovo cliccabile.',
      },
    ],
    pr: [61],
  },
  {
    versione: '0.28.0',
    data: '2026-11-06',
    titolo: 'Pulizia delle iscrizioni degli anni passati',
    voci: [
      {
        tipo: 'nuovo',
        testo:
          'Nella finestra di un anno accademico concluso gli uffici trovano “Elimina le iscrizioni”: dopo aver scaricato il file, cancellano in un colpo le iscrizioni di quell’anno. Doppia conferma, nessuna email agli studenti.',
      },
    ],
    pr: [59],
  },
  {
    versione: '0.27.0',
    data: '2026-11-06',
    titolo: 'Email di conferma ed elenchi in Excel',
    voci: [
      {
        tipo: 'nuovo',
        testo:
          'Lo studente riceve un’email quando si iscrive o annulla l’iscrizione a un corso o a un esame, con le date e il link a “La mia area”. Parte solo quando sarà configurato TurboSMTP.',
      },
      {
        tipo: 'nuovo',
        testo:
          '“Scarica l’elenco” sopra gli iscritti di ogni corso e appello: un file CSV che si apre con Excel. Dalla finestra di iscrizione gli uffici scaricano tutte le iscrizioni dell’anno accademico.',
      },
      {
        tipo: 'corretto',
        testo:
          'Quando un’iscrizione non è possibile (finestra chiusa, livello sbagliato, doppione) lo studente legge il motivo invece di “An unknown error occurred”.',
      },
    ],
    pr: [58],
  },
  {
    versione: '0.26.0',
    data: '2026-11-06',
    titolo: 'Appelli e iscrizioni agli esami',
    voci: [
      {
        tipo: 'nuovo',
        testo:
          'Appelli d’esame nel pannello: corso, sessione, livello, data, ora, aula e commissione. Li inseriscono segreteria, vicedirezione e admin; il docente può aggiungere turni ai propri corsi e prolungare le iscrizioni.',
      },
      {
        tipo: 'nuovo',
        testo:
          'Pagina /esami con gli appelli in programma, filtri per livello e ricerca; nella pagina di ogni corso la sezione “Esami”. Gli studenti si iscrivono da lì, un appello per corso e sessione, fino a una settimana prima dell’esame.',
      },
      {
        tipo: 'nuovo',
        testo:
          'Finestre di iscrizione per sessione d’esami, con l’opzione “Solo chi è iscritto al corso” (per ora spenta). In “La mia area” la sezione “I tuoi esami”.',
      },
    ],
    pr: [57],
  },
  {
    versione: '0.25.0',
    data: '2026-11-06',
    titolo: 'Iscrizioni ai corsi',
    voci: [
      {
        tipo: 'nuovo',
        testo:
          'Finestre di iscrizione: segreteria, vicedirezione e admin fissano apertura e chiusura per semestre. Il docente può prolungarle sul proprio corso.',
      },
      {
        tipo: 'nuovo',
        testo:
          'Gli studenti si iscrivono dalla pagina del corso e annullano finché la finestra è aperta. Si iscrivono solo ai corsi del proprio livello.',
      },
      {
        tipo: 'nuovo',
        testo:
          'Il docente vede gli iscritti nella scheda “Iscritti” del corso, sempre, anche dopo la chiusura.',
      },
      {
        tipo: 'nuovo',
        testo:
          '“La mia area” per gli studenti (/la-mia-area): corsi a cui sono iscritti e una guida breve. Nell’header del sito, dopo l’accesso, le iniziali e “La mia area”: un menu con le iscrizioni e la guida per gli studenti, “Pannello” per il personale ed “Esci”.',
      },
    ],
    pr: [56],
  },
  {
    versione: '0.24.0',
    data: '2026-11-06',
    titolo: 'Guida del pannello per ruolo',
    voci: [
      {
        tipo: 'nuovo',
        testo:
          'Guida d’uso nel pannello (/admin/guida, dal punto di domanda in alto a destra): passi brevi per ogni sezione, solo quelle del proprio ruolo. Negli avvisi mostra anche le categorie che si possono usare.',
      },
      {
        tipo: 'nuovo',
        testo: 'Gli amministratori possono vedere la guida “come” ogni altro ruolo.',
      },
    ],
    pr: [55],
  },
  {
    versione: '0.23.0',
    data: '2026-11-06',
    titolo: 'Pannello su misura per ogni ruolo',
    voci: [
      {
        tipo: 'nuovo',
        testo:
          'Nel menu e in dashboard ognuno vede solo ciò che può modificare. Il docente trova il suo profilo, i suoi corsi, i suoi avvisi e i suoi file; gli uffici le pagine a loro affidate.',
      },
      {
        tipo: 'nuovo',
        testo:
          'Per i docenti, in dashboard: “Il mio profilo” e “I miei corsi”. I file caricati ricordano chi li ha caricati.',
      },
      {
        tipo: 'migliorato',
        testo:
          'Permessi allineati alla tabella dei ruoli: menu del sito solo agli admin; Scuole a vicedirezione e admin; Albertina Press a redazione e biblioteca; Albo online ad amministrativo e vicedirezione. Il changelog non compare ai docenti.',
      },
    ],
    pr: [54],
  },
  {
    versione: '0.22.0',
    data: '2026-11-06',
    titolo: 'Pagine delle scuole',
    voci: [
      {
        tipo: 'nuovo',
        testo:
          'Ogni scuola ha la sua pagina (/scuole/nome-scuola): presentazione, schede Triennio e Biennio con indirizzi, regolamento e piani di studio, coordinatori, docenti, video e ultimi avvisi. Testi e piani importati dal sito attuale.',
      },
      {
        tipo: 'nuovo',
        testo:
          'Pagina “Offerta formativa” (/scuole) con le scuole divise per dipartimento e il percorso dal dipartimento alla tesi.',
      },
      {
        tipo: 'migliorato',
        testo:
          'In homepage le scuole sono 3 per riga, con un riquadro introduttivo, e portano alla pagina della scuola invece che ai corsi.',
      },
      {
        tipo: 'nuovo',
        testo:
          'Nel pannello, scheda Scuole: percorsi Triennio e Biennio (si può disattivare il biennio), video YouTube e coordinatori scelti tra i docenti.',
      },
    ],
    pr: [53],
  },
  {
    versione: '0.21.0',
    data: '2026-11-06',
    titolo: 'Accesso con Google',
    voci: [
      {
        tipo: 'nuovo',
        testo:
          'Pulsante “Accedi con Google” per i soli account @albertina.academy. Con Google attivo il modulo con la password sparisce: resta solo come accesso di emergenza per gli amministratori.',
      },
      {
        tipo: 'nuovo',
        testo:
          'Al primo accesso gli studenti ricevono il ruolo Studente e i docenti in elenco il ruolo Docente, collegato al loro profilo. Il resto del personale vede una pagina di attesa finché un amministratore non assegna il ruolo.',
      },
      {
        tipo: 'nuovo',
        testo:
          'Nella dashboard gli amministratori trovano il riquadro “Da abilitare” con chi è entrato con Google ma non ha ancora un ruolo.',
      },
      {
        tipo: 'migliorato',
        testo:
          'Messaggi chiari sulla pagina di accesso quando l’account non è dell’Accademia o la richiesta è scaduta.',
      },
    ],
    pr: [52],
  },
  {
    versione: '0.20.0',
    data: '2026-11-06',
    titolo: 'Design System',
    voci: [
      {
        tipo: 'nuovo',
        testo:
          'Nuova pagina /design-system, linkata nel footer: logo, logo in negativo e stemma, le icone delle dieci scuole (anche con sfondo) da scaricare una per una o tutte insieme in un file ZIP.',
      },
      {
        tipo: 'nuovo',
        testo:
          'Nella stessa pagina i colori con il loro uso e il contrasto del testo, la scala dei caratteri in Albert Sans e le regole per pulsanti e link. I valori sono gli stessi usati dal sito.',
      },
    ],
    pr: [51],
  },
  {
    versione: '0.19.0',
    data: '2026-11-06',
    titolo: 'Albertina Press e ruolo Biblioteca',
    voci: [
      {
        tipo: 'nuovo',
        testo:
          'Il catalogo Albertina Press in /accademia/albertina-press: 99 volumi con copertina, filtri per collana e ricerca per titolo, autore o ISBN.',
      },
      {
        tipo: 'nuovo',
        testo:
          'Ogni volume ha la sua scheda: dati bibliografici, descrizione e indice. Nel pannello si gestiscono in Contenuti › Albertina Press.',
      },
      {
        tipo: 'nuovo',
        testo:
          'Sotto il catalogo, il testo sulla casa editrice con comitato scientifico e collane; i nomi portano ai profili dei docenti.',
      },
      {
        tipo: 'nuovo',
        testo:
          'Nuovo ruolo Biblioteca: cura il catalogo Albertina Press, modifica le pagine Biblioteca e Albertina Press e pubblica gli avvisi della nuova categoria Biblioteca (orari, chiusure, acquisizioni).',
      },
      {
        tipo: 'migliorato',
        testo:
          'La bacheca del pannello mostra a ognuno solo le sezioni in cui può modificare qualcosa; c’è anche Albertina Press, con “Nuovo volume” tra le azioni rapide.',
      },
    ],
    pr: [50],
  },
  {
    versione: '0.18.0',
    data: '2026-11-05',
    titolo: 'Le scuole con icona e dipartimento',
    voci: [
      {
        tipo: 'nuovo',
        testo:
          'In home ogni scuola ha la sua scheda: foto, icona ufficiale, dipartimento e il link ai corsi.',
      },
      {
        tipo: 'nuovo',
        testo:
          'Nel pannello, in Scuole, si sceglie il dipartimento e si può caricare una foto al posto di quella di repertorio. L’icona ufficiale si vede di lato e non si cambia.',
      },
    ],
    pr: [49],
  },
  {
    versione: '0.17.0',
    data: '2026-11-05',
    titolo: 'Immagini ottimizzate, Vedi sul sito e ritocchi',
    voci: [
      {
        tipo: 'nuovo',
        testo:
          'Le foto caricate diventano WebP e si riducono da sole a Full HD (1920 px sul lato lungo); i dati della fotocamera e la posizione GPS vengono tolti.',
      },
      {
        tipo: 'nuovo',
        testo:
          'Il testo alternativo delle immagini si scrive da solo al caricamento, dal nome del file; si può sempre correggere.',
      },
      {
        tipo: 'nuovo',
        testo:
          'Nel pannello, pagine, avvisi, corsi, docenti, dottorandi, calendari e trasparenza hanno in alto a destra il pulsante “Vedi sul sito”.',
      },
      {
        tipo: 'migliorato',
        testo:
          'Nello slider della home i titoli lunghi stanno su tre righe al massimo, con un corpo più contenuto.',
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
      {
        tipo: 'corretto',
        testo: 'Il menu laterale delle pagine non finisce più sotto l’intestazione.',
      },
      {
        tipo: 'corretto',
        testo: 'Nella pagina Docenti le linee delle lettere non sono più rosse.',
      },
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
        testo:
          'Nel menu Didattica e nel footer la voce “Orari e calendari” porta alla pagina /calendari.',
      },
      {
        tipo: 'migliorato',
        testo:
          'I vecchi indirizzi dell’orario lezioni e dei calendari rimandano alla nuova pagina.',
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
      {
        tipo: 'nuovo',
        testo: 'Si filtrano per scuola o corso e si cercano per docente, aula o data.',
      },
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
      {
        tipo: 'migliorato',
        testo: 'Pulsanti dell’intestazione della stessa misura, comodi da toccare.',
      },
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
      {
        tipo: 'migliorato',
        testo: 'Pannello rinnovato: bacheca con azioni rapide e stile Albertina.',
      },
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
        testo: 'Pagine istituzionali composte a blocchi e menu del sito modificabile dal pannello.',
      },
    ],
    pr: [8, 9, 10, 11, 12],
  },
  {
    versione: '0.2.0',
    data: '2026-10-21',
    titolo: 'Avvisi',
    voci: [
      {
        tipo: 'nuovo',
        testo: 'Avvisi con categorie per ruolo: ognuno pubblica solo nelle proprie.',
      },
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
