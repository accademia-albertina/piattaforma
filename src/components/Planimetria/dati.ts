/**
 * Piani della sede di via Accademia Albertina 6, dalla planimetria del sito attuale
 * (wp-content/uploads/2024/10/piantina.jpg). Schema semplificato, non in scala: l'ala lungo
 * via Principe Amedeo (scala A) e la manica lungo via Accademia Albertina (scale P, C, S).
 * Le aule sono nell'ordine in cui si incontrano lungo il corridoio.
 */
export type Zona = 'A' | 'P' | 'C' | 'S' | 'G'
export type TipoLocale = 'aula' | 'ufficio' | 'speciale'
export type Locale = {
  /** Etichetta sulla pianta (breve). */
  sigla: string
  /** Nome completo, nell'elenco sotto la pianta. */
  nome?: string
  tipo?: TipoLocale
  /** Spazio relativo lungo il corridoio (1 = normale). */
  peso?: number
}
export type Piano = {
  id: string
  nome: string
  zone: Partial<Record<Zona, Locale[]>>
}

const uff = (sigla: string, nome = sigla, peso = 1): Locale => ({
  sigla,
  nome,
  tipo: 'ufficio',
  peso,
})

export const NOMI_ZONE: Record<Zona, string> = {
  A: 'Scala A',
  P: 'Scala P',
  C: 'Scala C',
  S: 'Scala S',
  G: 'Incisione',
}

export const PIANI: Piano[] = [
  {
    id: 'terra',
    nome: 'Piano terra',
    zone: {
      A: [{ sigla: 'A02' }, { sigla: 'A01', peso: 2 }],
      P: [{ sigla: 'P02' }, { sigla: 'P01', peso: 1.6 }],
      C: [
        { sigla: 'C01', peso: 1.4 },
        { sigla: 'C05' },
        uff('Erasmus', 'Ufficio Erasmus'),
        { sigla: 'Ingresso', tipo: 'speciale', peso: 1.3 },
        uff('Portineria'),
      ],
      S: [
        { sigla: 'S01', peso: 1.3 },
        { sigla: 'S02' },
        { sigla: 'S03' },
        { sigla: 'S04' },
        uff('Infermeria'),
      ],
      G: [
        { sigla: 'G01', peso: 2 },
        { sigla: 'G02' },
        { sigla: 'G03' },
        { sigla: 'G04' },
        { sigla: 'G05' },
      ],
    },
  },
  {
    id: 'primo',
    nome: 'Primo piano',
    zone: {
      A: [{ sigla: 'A13' }, { sigla: 'A12' }, { sigla: 'A11', peso: 2 }],
      P: [],
      C: [uff('Biblioteca', 'Biblioteca', 2)],
      S: [
        uff('Segreteria', 'Segreteria Didattica', 1.6),
        { sigla: 'S11' },
        { sigla: 'S13' },
        uff('Consulta', 'Consulta studentesca'),
      ],
    },
  },
  {
    id: 'secondo',
    nome: 'Secondo piano',
    zone: {
      A: [{ sigla: 'Pinacoteca', tipo: 'speciale', peso: 3 }],
      P: [
        { sigla: 'Sala azzurra', tipo: 'speciale', peso: 1.4 },
        uff('Direzione'),
        uff('Presidenza'),
      ],
      C: [
        uff('Dir. amm.', 'Direzione amministrativa'),
        uff('Logistica', 'Ufficio logistica e servizi informatici'),
        { sigla: 'Salone d’onore', tipo: 'speciale', peso: 2.2 },
        { sigla: 'C28' },
        { sigla: 'C29' },
      ],
      S: [
        uff('Ragioneria', 'Ufficio ragioneria'),
        uff('Acquisti', 'Ufficio acquisti'),
        uff('Personale', 'Ufficio del personale'),
        uff('Riunioni', 'Sala riunioni'),
      ],
    },
  },
  {
    id: 'terzo',
    nome: 'Terzo piano',
    zone: {
      A: [{ sigla: 'A33' }, { sigla: 'A34' }, { sigla: 'A32' }, { sigla: 'A31', peso: 1.6 }],
      P: [{ sigla: 'P31' }, { sigla: 'P32', peso: 1.6 }, { sigla: 'P33' }],
      C: [{ sigla: 'C31' }, { sigla: 'C32' }, { sigla: 'C33' }, { sigla: 'C34' }],
      S: [{ sigla: 'S34' }, { sigla: 'S33' }, { sigla: 'S31' }, { sigla: 'S32' }],
    },
  },
  {
    id: 'quarto',
    nome: 'Quarto piano',
    zone: {
      A: [{ sigla: 'A41', peso: 3 }],
      P: [{ sigla: 'P41' }],
      C: [{ sigla: 'C42' }, { sigla: 'C43' }, { sigla: 'C41' }],
      S: [{ sigla: 'S41' }, { sigla: 'S42' }],
    },
  },
]
