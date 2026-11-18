/**
 * Pagine scritte per il nuovo sito (non vengono da WordPress): Assistenza (ex Troubleshooting,
 * riscritta per l'accesso con Google), Guide per gli studenti e Open Days. Si creano solo se
 * l'indirizzo non esiste: dopo si modificano dal pannello come le altre pagine.
 */
import type { Payload } from 'payload'

import { GUIDA_STUDENTI, LINK_ISIDATA } from '@/content/guida-studenti'
import { blocchiPagina } from '@/lib/wp-import/contenuti/pagine'
import type { BloccoGrezzo } from '@/lib/wp-import/contenuti/pagine-html'

type PaginaNuova = { titolo: string; slug: string; sommario: string; blocchi: BloccoGrezzo[] }

const ASSISTENZA: PaginaNuova = {
  titolo: 'Assistenza',
  slug: 'assistenza',
  sommario:
    'Accesso con l’account Google dell’Accademia, iscrizioni a corsi ed esami e problemi più comuni.',
  blocchi: [
    {
      tipo: 'testo',
      html: `<p>Al sito si accede solo con l’account Google dell’Accademia (@albertina.academy): non serve registrarsi e non c’è una password del sito da ricordare. Qui sotto le domande più frequenti.</p>`,
    },
    {
      tipo: 'testo',
      html: '<h2>Accesso al sito</h2>',
    },
    {
      tipo: 'fisarmonica',
      voci: [
        {
          titolo: 'Come accedo?',
          html: `<p>Premi “Accedi” in alto a destra, poi “Accedi con Google”, e scegli il tuo account istituzionale:</p>
<ul>
<li>studenti della laurea: numero di matricola seguito da t, ad esempio 12345t@albertina.academy;</li>
<li>studenti della laurea magistrale: numero di matricola seguito da b, ad esempio 12345b@albertina.academy;</li>
<li>docenti e personale: nome.cognome@albertina.academy.</li>
</ul>
<p>Una volta dentro, in alto a destra compaiono le tue iniziali: da lì apri “La mia area” o esci.</p>`,
        },
        {
          titolo: 'Devo registrarmi?',
          html: `<p>No. Il primo accesso con l’account istituzionale crea il tuo profilo sul sito. Gli account creati sul vecchio sito non servono più.</p>`,
        },
        {
          titolo: 'Google mi fa entrare con un altro account (ad esempio quello personale)',
          html: `<p>Il sito accetta solo gli account @albertina.academy. Nella finestra di Google scegli “Usa un altro account” e inserisci quello istituzionale. Se sul telefono o sul computer hai più account Google, controlla di aver scelto quello giusto.</p>`,
        },
        {
          titolo: 'Non ricordo la password dell’account Google',
          html: `<p>La password è quella del tuo account Google istituzionale, non del sito. Puoi recuperarla dalla <a href="https://accounts.google.com/signin/recovery">pagina di recupero di Google</a>, con il numero di telefono o l’indirizzo email di recupero che hai impostato. Al primo accesso trovi le credenziali nella mail di benvenuto.</p>`,
        },
        {
          titolo: 'Non ho ancora la mail istituzionale',
          html: `<p>La casella @albertina.academy viene attribuita all’immatricolazione: per attivarla segui le indicazioni inviate dall’Ufficio Servizi Informatici. Finché non l’hai attivata non puoi accedere al sito, ma puoi consultare tutte le pagine pubbliche, gli avvisi e i calendari.</p>`,
        },
        {
          titolo: 'Sono docente o personale e vedo “Account in attesa di abilitazione”',
          html: `<p>Il tuo account è stato creato: un amministratore deve assegnarti il ruolo (ad esempio Docente, Segreteria o Biblioteca). Quando l’avrà fatto, ti basterà accedere di nuovo.</p>`,
        },
      ],
    },
    {
      tipo: 'testo',
      html: '<h2>Iscrizioni a corsi ed esami</h2>',
    },
    {
      tipo: 'fisarmonica',
      voci: [
        {
          titolo: 'Non vedo il pulsante per iscrivermi',
          html: `<p>Controlla di aver fatto l’accesso con l’account istituzionale e che le iscrizioni siano aperte: le date sono nel riquadro “Iscrizione al corso” o accanto all’appello. Puoi iscriverti solo ai corsi e agli appelli del tuo livello (laurea o laurea magistrale).</p>`,
        },
        {
          titolo: 'Come so che l’iscrizione è andata a buon fine?',
          html: `<p>L’iscrizione compare subito in <a href="/la-mia-area">La mia area</a>, nell’elenco dei tuoi corsi o dei tuoi esami. Se è lì, è registrata.</p>`,
        },
        {
          titolo: 'Voglio annullare un’iscrizione',
          html: `<p>Finché le iscrizioni sono aperte premi “Annulla l’iscrizione”, in La mia area o nella pagina del corso. Dopo la chiusura scrivi alla <a href="/studente/segreteria-didattica">Segreteria Didattica</a>.</p>`,
        },
      ],
    },
    {
      tipo: 'testo',
      html: `<h2>Isidata</h2>
<p>Carriera, tasse, piano di studi e verbali restano su <a href="${LINK_ISIDATA}">Isidata</a>, che ha un accesso separato con le credenziali ricevute all’immatricolazione. Come si usa è spiegato nella pagina <a href="/studente/matricole">Matricole</a>.</p>
<h2>Non hai trovato la risposta?</h2>
<p>Per iscrizioni, carriera e certificati scrivi alla Segreteria Didattica: <a href="mailto:didattica@albertina.academy">didattica@albertina.academy</a>. Gli altri uffici sono nella pagina <a href="/contatti">Contatti</a>.</p>`,
    },
  ],
}

const GUIDE: PaginaNuova = {
  titolo: 'Guide',
  slug: 'guide',
  sommario:
    'Come si usano il sito, la propria area e Isidata: le guide passo passo per gli studenti.',
  blocchi: [
    {
      tipo: 'testo',
      html: `<p>Le cose da sapere per usare il sito dell’Accademia: accesso, iscrizioni ai corsi e agli esami, la tua area. Le stesse indicazioni sono anche in fondo a <a href="/la-mia-area">La mia area</a>.</p>
<h2>Il sito</h2>`,
    },
    {
      tipo: 'fisarmonica',
      voci: GUIDA_STUDENTI.map((v) => ({
        titolo: v.titolo,
        html: `<ol>${v.passi.map((p) => `<li>${p}</li>`).join('')}</ol>`,
      })),
    },
    {
      tipo: 'testo',
      html: `<h2>Altre guide</h2>`,
    },
    {
      tipo: 'link',
      voci: [
        { etichetta: 'Matricole: l’Accademia e il profilo Isidata', url: '/studente/matricole' },
        { etichetta: 'Tasse: regolamento, importi e scadenze', url: '/studente/tasse' },
        {
          etichetta: 'Segreteria Didattica: orari e certificati',
          url: '/studente/segreteria-didattica',
        },
        { etichetta: 'Modulistica', url: '/studente/modulistica' },
        { etichetta: 'Assistenza: accesso e problemi più comuni', url: '/assistenza' },
      ],
    },
  ],
}

const SCUOLE = [
  ['Cinema, Fotografia e Audiovisivo', 'cinema-fotografia-e-audiovisivo'],
  [
    'Comunicazione e Valorizzazione del Patrimonio Artistico Contemporaneo',
    'comunicazione-e-valorizzazione-del-patrimonio-artistico-contemporaneo',
  ],
  ['Decorazione', 'decorazione'],
  ['Didattica dell’Arte', 'didattica-dellarte'],
  ['Grafica d’Arte', 'grafica-darte'],
  ['Nuove Tecnologie dell’Arte', 'nuove-tecnologie-dellarte'],
  ['Pittura', 'pittura'],
  ['Progettazione Artistica per l’Impresa', 'progettazione-artistica-per-limpresa'],
  ['Scenografia', 'scenografia'],
  ['Scultura', 'scultura'],
] as const

const OPEN_DAYS: PaginaNuova = {
  titolo: 'Open Days',
  slug: 'open-days',
  sommario: 'Le giornate in cui le scuole aprono aule e laboratori a chi vuole iscriversi.',
  blocchi: [
    {
      tipo: 'testo',
      html: `<p>Ogni anno, di solito a maggio, le dieci scuole dell’Accademia Albertina aprono aule e laboratori a chi pensa di iscriversi alla laurea o alla laurea magistrale. Docenti e studenti mostrano come si lavora, rispondono alle domande sui piani di studio e sull’esame di ammissione.</p>
<h2>Come funzionano</h2>
<ul>
<li>Ogni scuola ha le sue date: visite guidate alle aule in via Accademia Albertina 6 (Scenografia anche all’ex INCET) e incontri da remoto su Google Meet, per chi non può venire a Torino.</li>
<li>Di norma non serve prenotarsi; quando una scuola lo chiede, il programma riporta il modulo da compilare.</li>
<li>Il programma completo, con orari, aule e link agli incontri da remoto, si pubblica negli <a href="/avvisi">avvisi</a> qualche settimana prima.</li>
</ul>
<h2>Ultima edizione</h2>
<p>Open Days 2026, dal 4 al 15 maggio: <a href="/avvisi/open-days-accademia-albertina-2026">programma scuola per scuola</a>. Il programma del 2027 sarà pubblicato negli avvisi e in questa pagina.</p>
<h2>Le scuole</h2>
<p>Per informazioni su una scuola puoi scrivere al coordinatore, indicato nella pagina della scuola.</p>`,
    },
    {
      tipo: 'link',
      voci: SCUOLE.map(([nome, slug]) => ({
        etichetta: `Scuola di ${nome}`,
        url: `/scuole/${slug}`,
      })),
    },
    {
      tipo: 'testo',
      html: `<h2>Prima di venire</h2>`,
    },
    {
      tipo: 'link',
      voci: [
        { etichetta: 'Ammissioni: requisiti e domanda', url: '/didattica/ammissioni' },
        { etichetta: 'Piani di studio', url: '/didattica/piani-di-studio' },
        { etichetta: 'Visita virtuale dell’Accademia', url: 'https://tour.albertina-academy.it/' },
        { etichetta: 'Storia e sedi, con la planimetria', url: '/accademia/storia-e-sedi' },
      ],
    },
  ],
}

export const PAGINE_NUOVE = [ASSISTENZA, GUIDE, OPEN_DAYS]

export async function creaPagineNuove(payload: Payload) {
  for (const p of PAGINE_NUOVE) {
    const { totalDocs } = await payload.count({
      collection: 'pagine',
      where: { percorso: { equals: p.slug } },
      overrideAccess: true,
    })
    if (totalDocs) continue
    await payload.create({
      collection: 'pagine',
      data: {
        titolo: p.titolo,
        slug: p.slug,
        sommario: p.sommario,
        blocchi: await blocchiPagina(p.blocchi, payload.config),
        _status: 'published',
      },
      overrideAccess: true,
      context: { importazione: true },
    })
    payload.logger.info(`Pagina creata: /${p.slug}`)
  }
}
