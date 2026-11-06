/**
 * Contenuti della pagina /design-system: risorse scaricabili e colori.
 * I colori ripetono i valori di src/styles/colori.css: un test controlla che restino uguali.
 */

export const KIT = { href: '/design-system/kit-albertina.zip', peso: '650 KB' }

export type Download = { etichetta: string; href: string }

export const LOGHI: {
  nome: string
  anteprima: string
  sfondo: 'chiaro' | 'scuro'
  uso: string
  file: Download[]
}[] = [
  {
    nome: 'Logo',
    anteprima: '/design-system/logo-albertina.svg',
    sfondo: 'chiaro',
    uso: 'Su fondi chiari: documenti, locandine, firme email.',
    file: [
      { etichetta: 'SVG', href: '/design-system/logo-albertina.svg' },
      { etichetta: 'PNG', href: '/design-system/logo-albertina.png' },
    ],
  },
  {
    nome: 'Logo in negativo',
    anteprima: '/design-system/logo-albertina-bianco.svg',
    sfondo: 'scuro',
    uso: 'Su fondi scuri o fotografie: testo bianco, stemma a colori.',
    file: [
      { etichetta: 'SVG', href: '/design-system/logo-albertina-bianco.svg' },
      { etichetta: 'PNG', href: '/design-system/logo-albertina-bianco.png' },
    ],
  },
  {
    nome: 'Stemma',
    anteprima: '/design-system/stemma-albertina.svg',
    sfondo: 'chiaro',
    uso: 'Da solo, quando lo spazio è piccolo: icone, avatar, timbri.',
    file: [
      { etichetta: 'SVG', href: '/design-system/stemma-albertina.svg' },
      { etichetta: 'PNG', href: '/design-system/stemma-albertina.png' },
    ],
  },
]

/** Icone delle scuole: slug della scuola sul sito → nome del file scaricabile. */
export const ICONE: { scuola: string; nome: string; file: string }[] = [
  { scuola: 'pittura', nome: 'Pittura', file: 'pittura' },
  { scuola: 'scultura', nome: 'Scultura', file: 'scultura' },
  { scuola: 'grafica-darte', nome: 'Grafica', file: 'grafica' },
  { scuola: 'decorazione', nome: 'Decorazione', file: 'decorazione' },
  { scuola: 'scenografia', nome: 'Scenografia', file: 'scenografia' },
  {
    scuola: 'progettazione-artistica-per-limpresa',
    nome: 'Progettazione artistica per l’impresa',
    file: 'pai',
  },
  { scuola: 'nuove-tecnologie-dellarte', nome: 'Nuove tecnologie dell’arte', file: 'nta' },
  {
    scuola: 'cinema-fotografia-e-audiovisivo',
    nome: 'Cinema, fotografia e audiovisivo',
    file: 'cinema',
  },
  {
    scuola: 'comunicazione-e-valorizzazione-del-patrimonio-artistico-contemporaneo',
    nome: 'Comunicazione e valorizzazione del patrimonio artistico contemporaneo',
    file: 'comunicazione',
  },
  { scuola: 'didattica-dellarte', nome: 'Didattica dell’arte', file: 'didattica' },
]

export type Colore = { nome: string; token: string; hex: string; uso: string }

export const GRUPPI_COLORI: { titolo: string; colori: Colore[] }[] = [
  {
    titolo: 'Istituzionali',
    colori: [
      {
        nome: 'Rosso Albertina',
        token: '--color-brand-strong',
        hex: '#a23130',
        uso: 'Header e occhielli. Il colore dell’Accademia.',
      },
      {
        nome: 'Rosso accento',
        token: '--color-brand',
        hex: '#d14040',
        uso: 'Solo dettagli grafici e testo grande.',
      },
      {
        nome: 'Rosso scuro',
        token: '--color-brand-dark',
        hex: '#5b1b1b',
        uso: 'Barra superiore del sito.',
      },
      { nome: 'Blu notte', token: '--color-footer', hex: '#1c3038', uso: 'Footer.' },
    ],
  },
  {
    titolo: 'Testo e azioni',
    colori: [
      { nome: 'Inchiostro', token: '--color-text', hex: '#12191d', uso: 'Testo corrente.' },
      {
        nome: 'Ardesia scura',
        token: '--color-heading',
        hex: '#202f37',
        uso: 'Titoli, link e pulsanti principali.',
      },
      {
        nome: 'Ardesia',
        token: '--color-ardesia',
        hex: '#5f747f',
        uso: 'Testo secondario, link al passaggio, bordi dei campi.',
      },
    ],
  },
  {
    titolo: 'Superfici',
    colori: [
      {
        nome: 'Azzurro 200',
        token: '--color-azzurro-200',
        hex: '#d6e0e6',
        uso: 'Schede e pannelli.',
      },
      { nome: 'Azzurro 100', token: '--color-azzurro-100', hex: '#e3eaee', uso: 'Etichette.' },
      {
        nome: 'Azzurro 50',
        token: '--color-azzurro-50',
        hex: '#f1f5f7',
        uso: 'Riquadri al passaggio.',
      },
      { nome: 'Bianco', token: '--color-bg', hex: '#ffffff', uso: 'Sfondo delle pagine.' },
    ],
  },
]

/** Contrasto WCAG tra due colori esadecimali (#rrggbb). */
export function contrasto(a: string, b: string): number {
  const lum = (hex: string) => {
    const [r, g, bl] = [1, 3, 5].map((i) => {
      const c = parseInt(hex.slice(i, i + 2), 16) / 255
      return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
    })
    return 0.2126 * r + 0.7152 * g + 0.0722 * bl
  }
  const [l1, l2] = [lum(a), lum(b)].sort((x, y) => y - x)
  return (l1 + 0.05) / (l2 + 0.05)
}

/** Testo da usare sopra un colore: bianco o inchiostro, quello che contrasta di più. */
export function testoSopra(hex: string) {
  const bianco = contrasto(hex, '#ffffff')
  const scuro = contrasto(hex, '#12191d')
  return bianco >= scuro
    ? { nome: 'bianco' as const, rapporto: bianco }
    : { nome: 'inchiostro' as const, rapporto: scuro }
}

export const SCALA_TIPOGRAFICA = [
  { nome: 'Titolo di pagina', token: '--font-size-display', misura: '38–64 px', peso: 700 },
  { nome: 'Titolo grande', token: '--font-size-3xl', misura: '34–56 px', peso: 700 },
  { nome: 'Titolo di sezione', token: '--font-size-2xl', misura: '26–36 px', peso: 700 },
  { nome: 'Sottotitolo', token: '--font-size-xl', misura: '24 px', peso: 600 },
  { nome: 'Testo d’apertura', token: '--font-size-lg', misura: '20 px', peso: 400 },
  { nome: 'Testo corrente', token: '--font-size-md', misura: '17 px', peso: 400 },
  { nome: 'Etichetta', token: '--font-size-2xs', misura: '12 px, maiuscoletto', peso: 600 },
]
