/**
 * Contenuti demo per l'anteprima online: 40 avvisi pubblici veri, le pagine Didattica/Studente
 * con Ammissioni e Segreteria didattica, il menu. Parte solo con SEED_DEMO=true e database vuoto.
 * Nessun dato personale: niente utenti (il primo admin si crea da /admin).
 */
import path from 'path'
import type { Payload } from 'payload'
import { fileURLToPath } from 'url'

import {
  MENU_FOOTER,
  MENU_IN_EVIDENZA,
  MENU_LEGALE,
  MENU_PRINCIPALE,
  MENU_SERVIZI,
  SOCIAL,
  type VoceMenu,
} from '@/lib/navigazione'
import type { Avviso } from '@/payload-types'

import avvisiDemo from './avvisi-demo.json'

const dirname = path.dirname(fileURLToPath(import.meta.url))

const SCUOLE: Record<string, [string, string]> = {
  pittura: ['Pittura', 'PIT'],
  scultura: ['Scultura', 'SCU'],
  decorazione: ['Decorazione', 'DEC'],
  grafica: ["Grafica d'Arte", 'GRA'],
  scenografia: ['Scenografia', 'SCE'],
  nta: ["Nuove Tecnologie dell'Arte", 'NTA'],
  didattica: ["Didattica dell'Arte", 'DID'],
  comunicazione: ['Comunicazione e Valorizzazione del Patrimonio Artistico Contemporaneo', 'CVPAC'],
  pai: ["Progettazione Artistica per l'Impresa", 'PAI'],
  cinema: ['Cinema, Fotografia e Audiovisivo', 'CFA'],
}

type N = Record<string, unknown>
const testo = (t: string, format = 0): N => ({
  type: 'text',
  text: t,
  format,
  detail: 0,
  mode: 'normal',
  style: '',
  version: 1,
})
const p = (...c: (string | N)[]): N => ({
  type: 'paragraph',
  format: '',
  indent: 0,
  version: 1,
  direction: 'ltr',
  textFormat: 0,
  children: c.map((x) => (typeof x === 'string' ? testo(x) : x)),
})
const ul = (...voci: string[]): N => ({
  type: 'list',
  listType: 'bullet',
  tag: 'ul',
  start: 1,
  format: '',
  indent: 0,
  version: 1,
  direction: 'ltr',
  children: voci.map((v, i) => ({
    type: 'listitem',
    value: i + 1,
    format: '',
    indent: 0,
    version: 1,
    direction: 'ltr',
    children: [testo(v)],
  })),
})
const rt = (...children: N[]) =>
  ({
    root: { type: 'root', format: '', indent: 0, version: 1, direction: 'ltr', children },
  }) as never
const B = (s: string) => testo(s, 1)

export async function seedDemo(payload: Payload) {
  const { totalDocs } = await payload.count({ collection: 'avvisi' })
  if (totalDocs > 0) return
  payload.logger.info('Carico i contenuti demo…')

  const media = await payload.create({
    collection: 'media',
    data: { alt: 'Facciata dell’Accademia Albertina in via Accademia Albertina' },
    filePath: path.join(dirname, 'facciata.jpg'),
  })

  const scuole: Record<string, number> = {}
  for (const [k, [nome, sigla]] of Object.entries(SCUOLE)) {
    scuole[k] = (await payload.create({ collection: 'scuole', data: { nome, sigla } })).id
  }

  for (const a of avvisiDemo) {
    await payload.create({
      collection: 'avvisi',
      draft: false,
      data: {
        titolo: a.titolo,
        categorie: a.categorie as Avviso['categorie'],
        scuole: a.scuole.map((s) => scuole[s]).filter(Boolean),
        pubblicatoIl: new Date(a.data).toISOString(),
        immagine: a.immagine ? media.id : undefined,
        contenuto: rt(...a.paragrafi.map((t) => p(t))),
        _status: 'published',
      },
    })
  }

  const crea = (data: N) =>
    payload.create({
      collection: 'pagine',
      draft: false,
      data: { _status: 'published', ...data } as never,
    })

  const didattica = await crea({
    titolo: 'Didattica',
    sommario:
      'Ammissioni, iscrizioni, piani di studio e trasferimenti per i corsi di Triennio e Biennio.',
    blocchi: [{ blockType: 'immagine', immagine: media.id, larghezza: 'piena' }],
  })
  const studente = await crea({
    titolo: 'Studente',
    sommario: 'Servizi, segreteria, tasse e modulistica per chi studia in Accademia.',
  })

  await crea({
    titolo: 'Ammissioni',
    genitore: didattica.id,
    ufficiEditori: ['segreteria'],
    sommario:
      'Esami di ammissione al Triennio e al Biennio per l’A.A. 2026/2027: date, domanda su Isidata e documenti da allegare.',
    blocchi: [
      {
        blockType: 'testo',
        testo: rt(
          p(
            'Gli esami di ammissione (Triennio e Biennio) si svolgeranno ',
            B('dal 14 settembre 2026'),
            '.',
          ),
          p(
            'La domanda si presenta ',
            B('solo online su Isidata'),
            ', ',
            B('dal 13 luglio al 31 agosto 2026'),
            '. Ci si può iscrivere a un solo esame di ammissione.',
          ),
          p(
            B('Attenzione:'),
            ' chi deve completare o integrare una domanda non inviata rientra su Isidata con codice e password, da “Modifica domanda di ammissione”, e non crea una nuova domanda.',
          ),
        ),
      },
      {
        blockType: 'link',
        titolo: 'Presentare la domanda',
        voci: [
          {
            etichetta: 'Domanda di ammissione su Isidata',
            tipo: 'esterno',
            url: 'https://servizi1.isidata.net/SSDidatticheAC/MainGeneraleRes.aspx',
            descrizione: 'Scegli “Accademie” e poi Accademia Albertina di Torino.',
          },
          {
            etichetta: 'Istruzioni per la domanda A.A. 2026/2027 (PDF)',
            tipo: 'esterno',
            url: 'https://albertina-academy.it/wp-content/uploads/2026/07/2-Istruzioni-inserimento-domanda-di-ammissione-2026_2027-ok.pdf',
          },
          {
            etichetta: 'Preiscrizione su Universitaly',
            tipo: 'esterno',
            url: 'https://www.universitaly.it',
            descrizione: 'Solo per studenti extra UE con titolo di studio estero.',
          },
        ],
      },
      {
        blockType: 'fisarmonica',
        titolo: 'Documenti da allegare',
        voci: [
          {
            titolo: 'Per tutti i candidati',
            testo: rt(
              ul(
                'Autocertificazione del titolo di studio',
                'Documento di identità in corso di validità',
                'Ricevuta del contributo di ammissione di 50,00 € (PagoPA, obbligatorio per tutti)',
                'Ricevuta della tassa di 15,13 € sul c.c.p. 1016 intestato ad Agenzia delle Entrate – Tasse scolastiche (non la pagano gli studenti senza cittadinanza italiana)',
              ),
            ),
          },
          {
            titolo: 'Studenti extra UE con titolo di studio estero',
            testo: rt(
              p(
                'Serve la preiscrizione su Universitaly per l’Accademia di Torino. Chi si è preiscritto su Universitaly presso un’altra Accademia non può iscriversi.',
              ),
              ul(
                'Copia dell’iscrizione su Universitaly',
                'Dichiarazione di valore in loco o certificazione CIMEA (12 anni di scolarità per il Triennio, 4 per il Biennio)',
                'Traduzione legalizzata del titolo di studio con gli esami sostenuti',
                'Certificato di lingua italiana B2 o iscrizione al corso con la data prevista dell’esame',
                'Foto autenticata, passaporto, permesso di soggiorno e codice fiscale',
              ),
            ),
          },
          {
            titolo: 'Studenti UE con titolo di studio estero',
            testo: rt(
              ul(
                'Dichiarazione di valore in loco o certificazione CIMEA',
                'Traduzione legalizzata del titolo di studio con gli esami sostenuti',
                'Documento di identità e codice fiscale',
              ),
            ),
          },
          {
            titolo: 'Biennio: titolo conseguito in un’altra istituzione',
            testo: rt(
              p(
                'Allega l’elenco degli esami sostenuti per il diploma o la laurea di primo livello (Università, Accademie, Politecnico, IED, IAD, ISIA).',
              ),
            ),
          },
        ],
      },
      {
        blockType: 'fisarmonica',
        titolo: 'Avvisi dei coordinatori',
        voci: [
          {
            titolo: 'Cinema, Fotografia e Audiovisivo',
            testo: rt(
              p(
                'Gli esiti dell’ammissione al colloquio orale sono affissi in bacheca in portineria; il coordinatore ha scritto a tutti i candidati.',
              ),
              p(
                'Colloqui: mercoledì 16/09/2026 ore 9:30, aule A12–A13; giovedì 17/09/2026 ore 9:30, aula A11.',
              ),
            ),
          },
          {
            titolo: 'Nuove Tecnologie dell’Arte',
            testo: rt(
              p(
                'I colloqui orali si terranno mercoledì 16 e giovedì 17 settembre. Biennio: mercoledì 16 settembre alle 10:00, aule A31–A33.',
              ),
            ),
          },
          {
            titolo: 'Pittura',
            testo: rt(
              p('È stato pubblicato un avviso a integrazione per gli esami di ammissione 2026.'),
            ),
          },
        ],
      },
      {
        blockType: 'contatti',
        titolo: 'Contatti',
        voci: [
          {
            nome: 'Segreteria didattica',
            ruolo: 'Domande di ammissione e iscrizioni',
            email: 'didattica@albertina.academy',
            telefono: '011 88 90 20',
            orari:
              'Lunedì e venerdì: ricevimento 10–12\nMartedì: sportello telefonico 9:30–11\nMercoledì: telefono 9:30–10:30, ricevimento 13:30–15\nGiovedì: sportello telefonico 13:30–15',
          },
        ],
      },
    ],
  })

  await crea({
    titolo: 'Iscrizioni',
    genitore: didattica.id,
    ufficiEditori: ['segreteria'],
    sommario: 'Immatricolazione e rinnovo dell’iscrizione agli anni successivi.',
  })
  await crea({
    titolo: 'Piani di studio',
    genitore: didattica.id,
    sommario: 'Insegnamenti e crediti dei corsi di Triennio e Biennio, scuola per scuola.',
  })
  await crea({
    titolo: 'Trasferimenti',
    genitore: didattica.id,
    ufficiEditori: ['segreteria'],
    sommario: 'Passaggio da e verso altre Accademie e Università.',
  })

  await crea({
    titolo: 'Segreteria didattica',
    genitore: studente.id,
    ufficiEditori: ['segreteria'],
    sommario: 'Orari, richiesta e ritiro di certificati, libretti e pergamene.',
    blocchi: [
      {
        blockType: 'contatti',
        voci: [
          {
            nome: 'Segreteria didattica',
            email: 'didattica@albertina.academy',
            orari:
              'Lunedì e venerdì: ricevimento 10–12\nMartedì: sportello telefonico 9:30–11\nMercoledì: telefono 9:30–10:30, ricevimento 13:30–15 (no certificati)\nGiovedì: sportello telefonico 13:30–15',
          },
        ],
      },
      {
        blockType: 'fisarmonica',
        titolo: 'Richiesta documenti',
        voci: [
          {
            titolo: 'Certificati',
            testo: rt(
              p(
                'I certificati non possono essere presentati alla Pubblica Amministrazione (art. 15, L. 183/2011): per gli enti pubblici si usa l’autocertificazione, stampabile da Isidata.',
              ),
            ),
          },
          {
            titolo: 'Attestati Corsi 24 CFA',
            testo: rt(
              p(
                'Sono emessi al completamento degli esami senza richiesta. Per il ritiro serve una marca da bollo da 16,00 €.',
              ),
            ),
          },
          {
            titolo: 'Libretti',
            testo: rt(p('Non serve richiederli: prenota il ritiro e porta una fototessera.')),
          },
          {
            titolo: 'Convenzioni di stage',
            testo: rt(
              p(
                'Per nuove convenzioni scrivi a stage@albertina.academy. Sul modulo va apposta una marca da bollo da 16,00 € a carico dell’ente ospitante.',
              ),
            ),
          },
        ],
      },
    ],
  })

  const pagine = (await payload.find({ collection: 'pagine', limit: 100, depth: 0 })).docs
  const link = (v: VoceMenu) => {
    const pg = pagine.find((x) => x.titolo === v.label)
    if (pg) return { etichetta: v.label, tipo: 'interno' as const, pagina: pg.id }
    return v.esterno
      ? { etichetta: v.label, tipo: 'esterno' as const, url: v.href }
      : { etichetta: v.label, tipo: 'percorso' as const, url: v.href }
  }
  await payload.updateGlobal({
    slug: 'navigazione',
    data: {
      inEvidenza: MENU_IN_EVIDENZA.map(link),
      colonne: MENU_PRINCIPALE.map((c) => ({
        gruppi: c.map((g) => ({ titolo: g.titolo, voci: g.voci.map(link) })),
      })),
      serviziSinistra: MENU_SERVIZI.sinistra.map(link),
      serviziDestra: MENU_SERVIZI.destra.map(link),
      footerLink: MENU_FOOTER.map(link),
      footerSocial: SOCIAL.map(link),
      footerLegale: MENU_LEGALE.map(link),
    },
  })
  payload.logger.info('Contenuti demo caricati.')
}

/** La prima versione della foto demo conteneva una striscia dell'header del vecchio sito: la sostituisce. */
export async function correggiFacciata(payload: Payload) {
  const { docs } = await payload.find({
    collection: 'media',
    where: { filename: { like: 'facciata' }, height: { equals: 660 } },
    depth: 0,
    limit: 5,
    overrideAccess: true,
  })
  for (const m of docs) {
    await payload.update({
      collection: 'media',
      id: m.id,
      data: {},
      filePath: path.join(dirname, 'facciata.jpg'),
      overwriteExistingFiles: true,
      overrideAccess: true,
    })
    payload.logger.info('Foto demo della facciata sostituita.')
  }
}
