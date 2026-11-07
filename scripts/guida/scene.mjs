// Scene della Guida del pannello: una schermata per ogni voce (o più, con suffisso -2, -3).
// `id` = id della guida in src/content/guide.ts (+ eventuale suffisso); `segni` = riquadri
// numerati: `n` è il numero del passo della guida a cui si riferisce il riquadro.
// `sel` è un selettore CSS (più elementi = un solo riquadro che li contiene) o una funzione
// (page) => Locator. Per i campi basta `#field-<nome>`: il riquadro prende tutto il campo.

const scheda = (testo) => (page) => page.locator('.tabs-field__tab-button', { hasText: testo })
const linguetta = (testo) => (page) => page.locator('.doc-tab', { hasText: testo })
const apriScheda = (testo) => async (page) => {
  await scheda(testo)(page).first().click()
  await page.waitForTimeout(300)
}
const primo =
  (collezione, filtro = '') =>
  async ({ api }) => {
    const { docs } = await api(`/${collezione}?limit=1&depth=0&sort=-updatedAt${filtro}`)
    return `/admin/collections/${collezione}/${docs[0].id}`
  }

export const SCENE = [
  {
    id: 'primi-passi',
    ruolo: 'redazione',
    url: '/admin',
    menu: true,
    // Con il menu aperto sotto i 1280 px Payload nasconde le icone in alto a destra
    larghezza: 1280,
    altezza: 760,
    segni: [
      { n: 2, sel: 'aside.nav .nav-group' },
      { n: 3, sel: 'section[aria-labelledby="azioni-rapide"]' },
      { n: 4, sel: '.piede-menu' },
      { n: 5, sel: '.azione-header, .app-header__account' },
    ],
  },
  {
    id: 'bozze',
    ruolo: 'redazione',
    url: primo('avvisi'),
    // Una modifica non salvata, così i pulsanti sono attivi come quando si lavora
    prima: async (page) => {
      await page.fill('#field-sommario', 'Sommario di prova.')
    },
    segni: [
      { n: 1, sel: '#action-save-draft' },
      { n: 2, sel: '#action-save' },
      { n: 3, sel: linguetta('Versioni') },
    ],
  },
  {
    id: 'avvisi',
    ruolo: 'redazione',
    url: '/admin/collections/avvisi/create',
    segni: [
      { n: 2, sel: '#field-titolo, #field-sommario' },
      { n: 3, sel: '#field-categorie, #field-scuole' },
      { n: 4, sel: '#field-immagine, .rich-text-lexical' },
      { n: 5, sel: ['#field-pubblicatoIl', '#action-save'] },
    ],
  },
  {
    id: 'file',
    ruolo: 'redazione',
    url: '/admin/collections/media/create',
    segni: [
      { n: 1, sel: '.dropzone, .file-field__upload' },
      { n: 2, sel: '#field-alt' },
    ],
  },
  {
    id: 'profilo',
    ruolo: 'docente',
    url: ({ docente }) => `/admin/collections/docenti/${docente.idDocente}`,
    prima: async (page) => {
      await page.locator('#field-foto').scrollIntoViewIfNeeded()
      await page.mouse.wheel(0, -120)
    },
    segni: [
      { n: 2, sel: '#field-foto, #field-ricevimento' },
      { n: 4, sel: '#action-save' },
    ],
  },
  {
    id: 'corsi-docente',
    ruolo: 'docente',
    url: ({ docente }) => `/admin/collections/corsi/${docente.idCorso}`,
    prima: apriScheda('Programma'),
    segni: [
      { n: 2, sel: scheda('Programma') },
      { n: 3, sel: scheda('Orari') },
      { n: 4, sel: '#action-save' },
    ],
  },
  {
    id: 'iscritti',
    ruolo: 'docente',
    url: ({ docente }) => `/admin/collections/corsi/${docente.idCorso}`,
    prima: apriScheda('Iscritti'),
    segni: [
      { n: 1, sel: scheda('Iscritti') },
      { n: 2, sel: '#field-prorogaIscrizioni' },
      { n: 3, sel: (page) => page.getByText('Scarica l’elenco') },
    ],
  },
  {
    id: 'corsi-docenti',
    ruolo: 'vicedirezione',
    url: primo('corsi', '&where[docenti][exists]=true'),
    segni: [
      { n: 1, sel: ['#field-titolo', '#field-livelli, #field-annoAccademico'] },
      { n: 2, sel: '#field-docenti' },
    ],
  },
  {
    id: 'pagine',
    ruolo: 'redazione',
    url: primo('pagine'),
    segni: [
      { n: 2, sel: '#field-blocchi .blocks-field__header, #field-blocchi .blocks-field__row' },
      { n: 3, sel: '#field-genitore' },
      { n: 4, sel: '#action-save' },
    ],
  },
  {
    id: 'calendari',
    ruolo: 'segreteria',
    url: primo('calendari'),
    segni: [
      { n: 3, sel: ['#field-avvertenze', '#field-pdf'] },
      { n: 4, sel: '#action-save' },
    ],
  },
  {
    id: 'calendari-2',
    ruolo: 'segreteria',
    url: primo('calendari'),
    prima: async (page) => {
      await page
        .locator('.tabella-calendario')
        .first()
        .evaluate((el) => el.scrollIntoView())
      await page.mouse.wheel(0, -160)
    },
    segni: [{ n: 2, sel: '.tabella-calendario' }],
  },
  {
    id: 'finestre',
    ruolo: 'segreteria',
    url: '/admin/collections/finestre-iscrizione/create',
    segni: [
      { n: 2, sel: '#field-tipo, #field-annoAccademico, #field-periodo' },
      { n: 3, sel: ['#field-apertura, #field-chiusura', '#action-save'] },
    ],
  },
  {
    id: 'appelli',
    ruolo: 'segreteria',
    url: '/admin/collections/appelli/create',
    segni: [
      {
        n: 2,
        sel: '#field-corso, #field-annoAccademico, #field-sessione, #field-data, #field-ora, #field-aula, #field-commissione',
      },
      { n: 3, sel: '#field-livelli' },
    ],
  },
  {
    id: 'albo',
    ruolo: 'amministrativo',
    url: '/admin/collections/albo/create',
    segni: [
      { n: 1, sel: '#field-titolo, #field-sezione, #field-pubblicatoIl' },
      { n: 2, sel: '#field-documenti' },
      { n: 4, sel: '#action-save' },
    ],
  },
  {
    id: 'press',
    ruolo: 'biblioteca',
    url: '/admin/collections/pubblicazioni/create',
    segni: [
      { n: 1, sel: '#field-titolo, #field-autori, #field-copertina, #field-descrizione' },
      { n: 3, sel: '#action-save' },
    ],
  },
  {
    id: 'scuole',
    ruolo: 'vicedirezione',
    url: primo('scuole'),
    segni: [
      { n: 1, sel: scheda('Scuola') },
      {
        n: 2,
        sel: (page) =>
          page.locator('.tabs-field__tab-button').filter({ hasText: /^(Triennio|Biennio)/ }),
      },
      { n: 3, sel: scheda('Persone') },
    ],
  },
  {
    id: 'utenti',
    ruolo: 'admin',
    url: '/admin',
    prima: async (page, { account }) => {
      await account('nuovo')
      await page.reload()
      await page.waitForLoadState('networkidle')
    },
    segni: [{ n: 1, sel: 'section[aria-labelledby="da-abilitare"]' }],
  },
  {
    id: 'utenti-2',
    ruolo: 'admin',
    url: async ({ api }) => {
      const { docs } = await api(
        '/users?where[email][equals]=mario.rossi%40albertina.academy&depth=0',
      )
      return `/admin/collections/users/${docs[0].id}`
    },
    segni: [{ n: 2, sel: ['#field-roles', '#action-save'] }],
  },
  {
    id: 'menu',
    ruolo: 'admin',
    url: '/admin/globals/navigazione',
    segni: [
      { n: 2, sel: '.tabs-field__tab-button' },
      { n: 3, sel: '#field-inEvidenza .array-field__header' },
      { n: 4, sel: '#action-save' },
    ],
  },
]
