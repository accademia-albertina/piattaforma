/**
 * Guide d'uso del pannello, una per sezione. Ognuno vede solo quelle delle sezioni che
 * può modificare (stessa tabella di src/access/pannello.ts); l'admin le vede tutte e può
 * vederle "come" un altro ruolo. Testi brevi, passi concreti, nomi dei pulsanti come
 * compaiono nel pannello.
 */
import { vedeSezione, type SezionePannello } from '@/access/pannello'
import { hasRole, isAdmin, type Role } from '@/access/roles'

export type Guida = {
  id: string
  titolo: string
  /** Sezione del pannello a cui si riferisce: la guida si vede solo a chi vede la sezione. */
  sezione?: SezionePannello
  /** In alternativa (o in più), i soli ruoli a cui serve. */
  ruoli?: Role[]
  intro: string
  passi: string[]
  consigli?: string[]
}

export const GUIDE: Guida[] = [
  {
    id: 'primi-passi',
    titolo: 'Primi passi',
    intro:
      'Il pannello è il retro del sito: qui si scrivono avvisi, pagine e programmi. Vedi solo le sezioni che puoi modificare.',
    passi: [
      'Entra da “Area riservata” sul sito con “Accedi con Google” e il tuo account @albertina.academy. Non serve una password diversa.',
      'La dashboard mostra le azioni rapide e le tue sezioni. Il menu a sinistra si apre con il pulsante in alto a sinistra.',
      'Dall’icona del profilo in alto a destra cambi nome, lingua e tema (chiaro o scuro) ed esci.',
      'In alto a destra il punto di domanda apre questa guida e il globo apre il sito in una nuova scheda.',
    ],
    consigli: [
      'Se una sezione che ti serve non compare, chiedi all’amministratore: dipende dal tuo ruolo.',
    ],
  },
  {
    id: 'bozze',
    titolo: 'Bozze, pubblicazione e versioni',
    ruoli: [
      'admin',
      'vicedirezione',
      'redazione',
      'segreteria',
      'amministrativo',
      'erasmus',
      'biblioteca',
      'docente',
    ],
    intro: 'Avvisi, pagine, corsi, calendari e atti hanno una bozza e una versione pubblicata.',
    passi: [
      '“Salva bozza” conserva il lavoro senza mostrarlo sul sito.',
      '“Pubblica modifiche” lo rende visibile subito a tutti.',
      'Nelle pagine, il pulsante “Anteprima” mostra come apparirà la pagina prima di pubblicarla.',
      'Nella scheda “Versioni” trovi le versioni precedenti e puoi ripristinarne una.',
    ],
  },
  {
    id: 'avvisi',
    titolo: 'Avvisi',
    sezione: 'avvisi',
    intro:
      'Gli avvisi compaiono in /avvisi, nella homepage e nelle pagine delle scuole scelte. Puoi usare solo le categorie del tuo ruolo.',
    passi: [
      'Dalla dashboard scegli “Nuovo avviso”.',
      'Scrivi un titolo breve e un sommario di una o due righe: è quello che si legge negli elenchi.',
      'Scegli una o più categorie e, se riguarda solo alcune scuole, le scuole.',
      'Scrivi il testo; aggiungi un’immagine e gli allegati (PDF) se servono.',
      'Controlla la data di pubblicazione e premi “Pubblica modifiche”.',
    ],
    consigli: [
      'Il titolo va scritto normalmente, non tutto in maiuscolo.',
      'I docenti vedono e modificano solo gli avvisi che hanno scritto loro.',
    ],
  },
  {
    id: 'file',
    titolo: 'File e immagini',
    sezione: 'media',
    intro: 'Qui stanno le foto e i PDF usati in avvisi, pagine e profili.',
    passi: [
      'Scegli “Carica un file” e trascina il file: sono ammessi JPG, PNG, WebP, SVG e PDF.',
      'Scrivi il testo alternativo: descrive l’immagine a chi non la vede. Se lo lasci vuoto lo ricaviamo dal nome del file.',
      'Le foto vengono ridotte e convertite da sole per caricarsi in fretta: puoi caricare l’originale.',
    ],
    consigli: ['I docenti vedono solo i file che hanno caricato loro.'],
  },
  {
    id: 'profilo',
    titolo: 'Il tuo profilo da docente',
    ruoli: ['docente'],
    intro:
      'Il profilo compare in /docenti e nelle schede dei tuoi corsi. Al primo accesso con Google viene collegato al tuo account.',
    passi: [
      'Dalla dashboard scegli “Il mio profilo”.',
      'Aggiungi una foto (quadrata o verticale), l’orario di ricevimento e una breve biografia.',
      'Se vuoi, carica il curriculum in PDF.',
      'Premi “Salva”.',
    ],
    consigli: [
      'Nome, scuole e ruolo li aggiorna la vicedirezione: scrivile se c’è un errore.',
    ],
  },
  {
    id: 'corsi-docente',
    titolo: 'I tuoi corsi',
    ruoli: ['docente'],
    intro:
      'Ogni corso ha un programma che aggiorni tu. Titolo, docenti, crediti e piano di studio li gestisce la vicedirezione.',
    passi: [
      'Dalla dashboard scegli “I miei corsi” e apri il corso.',
      'Nella scheda “Programma” scrivi obiettivi e contenuti, bibliografia e altre informazioni; indica se sono previsti esoneri o revisioni.',
      'Nella scheda “Orari” aggiungi giorno, ora e aula delle lezioni per ogni periodo.',
      'Premi “Pubblica modifiche”: la scheda del corso sul sito si aggiorna subito.',
    ],
    consigli: [
      'Se un corso che insegni non compare, o compare un corso non tuo, scrivi alla vicedirezione.',
    ],
  },
  {
    id: 'corsi-docenti',
    titolo: 'Corsi e docenti',
    ruoli: ['admin', 'vicedirezione'],
    intro:
      'Un corso è una materia con il suo docente (o la co-docenza) per un anno accademico: stessa materia con docenti diversi = corsi diversi.',
    passi: [
      'In “Corsi” crea il corso con titolo, livello, anno accademico, crediti e settore.',
      'Assegna uno o più docenti: da quel momento il docente può aggiornarne programma e orari.',
      'In “Docenti” tieni aggiornati nome, scuole, ruolo e “In servizio”. Chi non è più in servizio sparisce dal sito ma resta nello storico.',
      'L’account del docente si collega da solo al primo accesso con Google, se l’email è la stessa del profilo.',
    ],
  },
  {
    id: 'pagine',
    titolo: 'Pagine',
    sezione: 'pagine',
    intro:
      'Le pagine istituzionali (Didattica, Ammissioni, Erasmus…) sono fatte a blocchi: testo, immagini, elenchi di link e documenti.',
    passi: [
      'Apri la pagina dall’elenco o creane una nuova (solo redazione, vicedirezione e admin).',
      'Aggiungi, sposta o elimina i blocchi; ogni blocco ha un titolo che lo riassume quando è chiuso.',
      'La “Pagina genitore” decide l’indirizzo: per esempio Iscrizioni sotto Didattica diventa /didattica/iscrizioni.',
      'Premi “Pubblica modifiche”.',
    ],
    consigli: [
      'Gli uffici vedono solo le pagine a loro affidate: la redazione le affida dal campo “Uffici che possono modificarla”.',
      'Eliminare una pagina rompe link e menu: lo fa solo l’amministratore.',
    ],
  },
  {
    id: 'calendari',
    titolo: 'Calendari',
    sezione: 'calendari',
    intro:
      'Orario delle lezioni, esami e presentazioni si compilano come una tabella; il sito li mostra in /calendari con i filtri e la stampa.',
    passi: [
      'Apri il calendario dell’anno accademico o creane uno scegliendo il tipo.',
      'Aggiungi le righe della tabella: ogni riga è una lezione, un appello o una presentazione.',
      'Indica sedi e avvertenze; se esiste, allega anche il PDF ufficiale.',
      'Premi “Pubblica modifiche”.',
    ],
  },
  {
    id: 'albo',
    titolo: 'Albo online',
    sezione: 'albo',
    intro: 'Bandi, procedure e comunicazioni con valore ufficiale, in /albo.',
    passi: [
      'Crea un atto con titolo, sezione, categoria e date di pubblicazione e scadenza.',
      'Aggiungi i documenti (file o link).',
      'Quando arrivano nomina, verbali o graduatoria, aggiungili allo stesso atto: non crearne uno nuovo.',
      'Premi “Pubblica modifiche”.',
    ],
  },
  {
    id: 'trasparenza',
    titolo: 'Amministrazione trasparente',
    sezione: 'trasparenza',
    intro: 'Le sottosezioni previste dalla legge, in /amministrazione-trasparente.',
    passi: [
      'Apri la sottosezione da aggiornare.',
      'Aggiorna il testo o i documenti.',
      'Premi “Pubblica modifiche”: la data di aggiornamento mostrata sul sito cambia da sola.',
    ],
  },
  {
    id: 'press',
    titolo: 'Albertina Press',
    sezione: 'pubblicazioni',
    intro: 'Il catalogo della casa editrice, in /accademia/albertina-press.',
    passi: [
      'Crea un volume con titolo, autori, copertina e descrizione.',
      'Compila collana, anno, pagine, ISBN e prezzo; l’indice è facoltativo.',
      'Premi “Salva”.',
    ],
    consigli: ['Eliminare un volume dal catalogo spetta solo all’amministratore.'],
  },
  {
    id: 'scuole',
    titolo: 'Scuole',
    sezione: 'scuole',
    intro: 'Le dieci scuole con la loro pagina in /scuole.',
    passi: [
      'Nella scheda “Scuola” cambi presentazione, foto e video (solo link YouTube).',
      'Nelle schede “Triennio” e “Biennio” aggiorni sezioni e piani di studio; togli la spunta al biennio se la scuola non lo prevede.',
      'In “Persone” scegli i coordinatori tra i docenti. L’elenco dei docenti della scuola viene dai loro profili.',
    ],
  },
  {
    id: 'dottorandi',
    titolo: 'Dottorandi',
    sezione: 'dottorandi',
    intro: 'I profili dei dottorandi, in /dottorati/albertina/dottorandi.',
    passi: [
      'Crea o aggiorna il profilo con ciclo, curriculum, supervisor e progetto di ricerca.',
      'Togli “In corso” quando il dottorato è concluso.',
    ],
  },
  {
    id: 'utenti',
    titolo: 'Utenti e ruoli',
    sezione: 'users',
    intro:
      'Gli studenti (12345t@, 12345b@) ricevono il ruolo da soli; i docenti pure, se l’email coincide con un profilo. Il resto del personale attende che tu assegni un ruolo.',
    passi: [
      'In dashboard, il riquadro “Da abilitare” elenca chi è entrato con Google ma non ha un ruolo.',
      'Apri l’account, scegli il ruolo (uno o più) e salva.',
      'Per togliere l’accesso al pannello basta togliere i ruoli.',
    ],
    consigli: [
      'Assegna il ruolo minimo che serve: ognuno vede solo le sezioni del suo ruolo.',
    ],
  },
  {
    id: 'menu',
    titolo: 'Menu del sito',
    sezione: 'navigazione',
    intro: 'Mega menu, barra in alto e link del footer.',
    passi: [
      'Apri “Menu del sito” dalle impostazioni.',
      'Aggiungi o sposta le voci; per le pagine interne l’indirizzo inizia con “/”.',
      'Premi “Salva”: il sito si aggiorna subito.',
    ],
  },
]

type Utente = { roles?: (Role | string)[] | null } | null | undefined

/** Le guide che servono a un utente, nell'ordine di GUIDE. L'admin le ha tutte. */
export function guideDi(user: Utente): Guida[] {
  if (isAdmin(user)) return GUIDE
  return GUIDE.filter(
    (g) =>
      (!g.ruoli && !g.sezione) ||
      (g.ruoli && hasRole(user, ...g.ruoli)) ||
      (g.sezione && vedeSezione(user, g.sezione)),
  )
}
