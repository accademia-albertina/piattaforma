/**
 * Testi predefiniti della home. Il global "Home" (src/globals/Home.ts) li usa come valori
 * iniziali nel pannello; il sito ci ricade se un campo viene lasciato vuoto.
 */

/** Icone tra cui scegliere per gli accessi rapidi (le icone vere sono in app/(frontend)/page.tsx). */
export const ICONE_HOME = [
  { value: 'ammissioni', label: 'Porta (ammissioni)' },
  { value: 'laurea', label: 'Tocco (offerta formativa)' },
  { value: 'calendario', label: 'Calendario' },
  { value: 'segreteria', label: 'Cartella (segreteria, pratiche)' },
  { value: 'libro', label: 'Libro' },
  { value: 'persone', label: 'Persone' },
  { value: 'documento', label: 'Documento' },
  { value: 'luogo', label: 'Luogo' },
  { value: 'email', label: 'Email' },
  { value: 'info', label: 'Informazioni' },
] as const

export type IconaHome = (typeof ICONE_HOME)[number]['value']

export const HOME_PREDEFINITA = {
  slider: { numero: 5 },
  accessiTitolo: 'Da dove vuoi iniziare?',
  accessiTesto:
    'Accademia Albertina di Belle Arti di Torino: Lauree e Lauree magistrali in arti visive, progettazione e nuove tecnologie.',
  accessi: [
    {
      titolo: 'Ammissioni',
      testo: 'Requisiti, prove e scadenze per entrare in Accademia.',
      icona: 'ammissioni' as IconaHome,
      tipo: 'percorso' as const,
      url: '/didattica/ammissioni',
    },
    {
      titolo: 'Offerta formativa',
      testo: 'Dieci scuole, laurea e laurea magistrale.',
      icona: 'laurea' as IconaHome,
      tipo: 'percorso' as const,
      url: '/scuole',
    },
    {
      titolo: 'Orari e calendari',
      testo: 'Lezioni, esami e sessioni di tesi.',
      icona: 'calendario' as IconaHome,
      tipo: 'percorso' as const,
      url: '/calendari',
    },
    {
      titolo: 'Segreteria didattica',
      testo: 'Orari di apertura, contatti e pratiche.',
      icona: 'segreteria' as IconaHome,
      tipo: 'percorso' as const,
      url: '/studente/segreteria-didattica',
    },
  ],
  manifesto:
    'Dal 1678 Torino ha la sua scuola d’arte. Dieci scuole, dalla pittura al cinema, dalla scultura alle nuove tecnologie. Un palazzo nel centro della città, una pinacoteca, i laboratori. Qui si impara un mestiere antico e si cerca la propria stella.',
  cifre: [
    { valore: 4, etichetta: 'Dipartimenti' },
    { valore: 10, etichetta: 'Scuole' },
    { valore: 2, etichetta: 'Livelli: Laurea e Laurea magistrale' },
  ],
  scuoleTitolo: 'Laurea e Laurea magistrale',
  scuoleTesto: 'Lauree e Lauree magistrali con lo stesso valore di quelle universitarie.',
  avviso: {
    mostra: true,
    titolo: 'Sito in costruzione',
    testo: 'Il sito ufficiale resta albertina-academy.it fino al passaggio alla nuova piattaforma.',
  },
  tour: {
    titolo: 'Esplora l’Accademia',
    testo:
      'Entra nelle aule, nei laboratori e negli spazi storici di via Accademia Albertina, da dove vuoi.',
    url: 'https://tour.albertina-academy.it/',
  },
}
