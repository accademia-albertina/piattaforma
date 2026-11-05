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
