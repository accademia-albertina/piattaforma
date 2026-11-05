/**
 * Struttura dei menu del sito, ripresa dal mega menu attuale.
 * Sono i valori predefiniti: il menu vero si modifica dal pannello (global Navigazione, vedi src/lib/menu.ts).
 */

export type VoceMenu = { label: string; href: string; esterno?: boolean }
export type GruppoMenu = { titolo: string; voci: VoceMenu[] }

export const MENU_SERVIZI: { sinistra: VoceMenu[]; destra: VoceMenu[] } = {
  sinistra: [
    {
      label: 'Ministero dell’Università e della Ricerca',
      href: 'https://www.mur.gov.it/it',
      esterno: true,
    },
  ],
  destra: [
    {
      label: 'Isidata',
      href: 'https://servizi13.isidata.net/SSDidatticheAC/MainGeneraleRes.aspx',
      esterno: true,
    },
    { label: 'Amministrazione trasparente', href: '/amministrazione-trasparente' },
  ],
}

export const MENU_IN_EVIDENZA: VoceMenu[] = [
  { label: 'Open Days', href: '/open-days' },
  { label: 'Segreteria didattica', href: '/studente/segreteria-didattica' },
  { label: 'Albo online', href: '/albo' },
  { label: 'Troubleshooting', href: '/troubleshooting' },
  { label: 'Contatti', href: '/contatti' },
]

/** Colonne del mega menu. Un elemento con più gruppi va nella stessa colonna. */
export const MENU_PRINCIPALE: GruppoMenu[][] = [
  [
    {
      titolo: 'Accademia',
      voci: [
        { label: 'Storia e sedi', href: '/accademia/storia-e-sedi' },
        { label: 'Ordinamento', href: '/accademia/ordinamento' },
        { label: 'Organigramma', href: '/accademia/organigramma' },
        { label: 'Il saluto del Direttore', href: '/accademia/il-saluto-del-direttore' },
        { label: 'Albertina Press', href: '/accademia/albertina-press' },
        { label: 'Biblioteca', href: '/accademia/biblioteca' },
        { label: 'Pinacoteca', href: 'https://www.pinacotecalbertina.it', esterno: true },
      ],
    },
  ],
  [
    {
      titolo: 'Didattica',
      voci: [
        { label: 'Piani di studio', href: '/didattica/piani-di-studio' },
        { label: 'Manifesto degli studi', href: '/didattica/manifesto-degli-studi' },
        { label: 'Corsi', href: '/corsi' },
        { label: 'Docenti', href: '/docenti' },
        { label: 'Orari e calendari', href: '/calendari' },
        { label: 'Ammissioni', href: '/didattica/ammissioni' },
        { label: 'Iscrizioni', href: '/didattica/iscrizioni' },
        { label: 'Trasferimenti', href: '/didattica/trasferimenti' },
      ],
    },
  ],
  [
    {
      titolo: 'Dottorati',
      voci: [
        { label: 'Dottorati Accademia Albertina', href: '/dottorati/albertina' },
        { label: 'Dottorati convenzionati', href: '/dottorati/convenzionati' },
      ],
    },
    {
      titolo: 'Erasmus+',
      voci: [
        { label: 'Bandi Erasmus', href: '/erasmus/bandi' },
        { label: 'Mobilità studenti', href: '/erasmus/mobilita-studenti' },
        { label: 'Mobilità docenti e staff', href: '/erasmus/mobilita-docenti-staff' },
        { label: 'Incoming students', href: '/erasmus/incoming-students' },
      ],
    },
  ],
  [
    {
      titolo: 'Studente',
      voci: [
        { label: 'Modulistica', href: '/studente/modulistica' },
        { label: 'Tasse', href: '/studente/tasse' },
        { label: 'Consulta', href: '/studente/consulta' },
        { label: 'Tesi', href: '/studente/tesi' },
        { label: 'Borse di studio', href: '/studente/borse-di-studio' },
        { label: 'Segreteria', href: '/studente/segreteria-didattica' },
        { label: 'Stage e tirocinio', href: '/studente/stage-tirocinio' },
        { label: 'Sportelli', href: '/studente/sportelli' },
        { label: 'Tutoraggio interculturale', href: '/studente/tutoraggio-interculturale' },
      ],
    },
  ],
  [
    {
      titolo: 'Avvisi',
      voci: [
        { label: 'Tutti gli avvisi', href: '/avvisi' },
        { label: 'Generali', href: '/avvisi?categoria=generali' },
        { label: 'Lezioni', href: '/avvisi?categoria=lezioni' },
        { label: 'Esami', href: '/avvisi?categoria=esami' },
        { label: 'Tasse', href: '/avvisi?categoria=tasse' },
        { label: 'Coordinatori', href: '/avvisi?categoria=coordinatori' },
        { label: 'Eventi', href: '/avvisi?categoria=eventi' },
        { label: 'Bandi e concorsi', href: '/avvisi?categoria=bandi-e-concorsi' },
      ],
    },
  ],
]

/** Dati istituzionali mostrati nel footer (dal footer del sito attuale). */
export const CONTATTI = {
  indirizzo: ['Via Accademia Albertina 6', '10123 Torino (TO)'],
  mappa: 'https://maps.app.goo.gl/WXoEjxb119DN2izk6',
  telefono: { label: '011 88 90 20', href: 'tel:+39011889020' },
  peo: 'protocollo@albertina.academy',
  pec: 'accademia.torino@pec.it',
  codiceFiscale: '80092570011',
  partitaIva: '11112140014',
}

export const MENU_FOOTER: VoceMenu[] = [
  { label: 'Avvisi', href: '/avvisi' },
  { label: 'Guide', href: '/guide' },
  { label: 'Orari e calendari', href: '/calendari' },
  {
    label: 'Isidata',
    href: 'https://servizi13.isidata.net/SSDidatticheAC/MainGeneraleRes.aspx',
    esterno: true,
  },
  { label: 'Virtual tour', href: 'https://tour.albertina-academy.it/', esterno: true },
  { label: 'Troubleshooting', href: '/troubleshooting' },
  { label: 'Amministrazione trasparente', href: '/amministrazione-trasparente' },
  { label: 'Albo online', href: '/albo' },
]

export const SOCIAL: VoceMenu[] = [
  { label: 'Instagram', href: 'https://www.instagram.com/accademia_albertina/', esterno: true },
  { label: 'Facebook', href: 'https://www.facebook.com/groups/accademialbertina', esterno: true },
  {
    label: 'LinkedIn',
    href: 'https://www.linkedin.com/school/accademia-albertina-torino/',
    esterno: true,
  },
  {
    label: 'YouTube',
    href: 'https://www.youtube.com/@AccademiaAlbertinadiBelleArti',
    esterno: true,
  },
  { label: 'Telegram', href: 'https://t.me/accademialbertina', esterno: true },
]

/** Link obbligatori per una PA (AGID, GDPR). */
export const MENU_LEGALE: VoceMenu[] = [
  { label: 'Privacy', href: '/privacy-policy' },
  { label: 'Cookie', href: '/cookie-policy' },
  { label: 'Note legali', href: '/termini-e-condizioni' },
  { label: 'Dichiarazione di accessibilità', href: '/dichiarazione-accessibilita' },
  { label: 'Segnalazioni di accessibilità', href: '/segnalazioni-di-accessibilita' },
]
