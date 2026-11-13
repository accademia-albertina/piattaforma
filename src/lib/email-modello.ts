import { LOGO_EMAIL_PNG_BASE64 } from '@/lib/email-logo'

/**
 * Modello grafico delle email del sito, coerente con il design system (src/styles/colori.css).
 * Le email non leggono CSS esterni né variabili: i colori sono ripetuti qui, con gli stessi valori
 * e contrasti dei token. Tabelle e stili in linea perché Outlook e Gmail ignorano il resto.
 */
const COLORI = {
  istituzionale: '#a23130', // --color-brand-strong: bianco sopra 6,96
  sfondo: '#f1f5f7', // --color-azzurro-50
  pannello: '#f1f5f7', // --color-azzurro-50: #202f37 sopra 12,6
  bordo: '#e1e6e9', // --color-border
  titolo: '#202f37', // --color-heading
  testo: '#12191d', // --color-text
  secondario: '#46585f', // --color-ardesia-dark: 7,4 su bianco, 6,8 su azzurro-50
  pulsante: '#202f37', // --color-ink: bianco sopra 13,79
  footer: '#1c3038', // --color-footer: bianco sopra 13,73
  footerTesto: '#d6e0e6', // --color-azzurro-200 su footer: 10,9
}

const FONT = "'Albert Sans', Arial, Helvetica, sans-serif"

export const CID_LOGO = 'logo-albertina'

export type ContenutoEmail = {
  /** Etichetta maiuscola sopra il titolo (es. “Iscrizione ai corsi”). */
  occhiello: string
  titolo: string
  saluto: string
  paragrafi: string[]
  /** Riquadro con i dati principali (corso, data, aula…). */
  dettagli?: { etichetta: string; valore: string }[]
  pulsante?: { testo: string; url: string }
  /** Righe in piccolo dopo il pulsante. */
  note?: string[]
}

const escape = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

/** Testo con eventuali indirizzi web resi cliccabili. */
const conLink = (s: string) =>
  escape(s).replace(
    /(https?:\/\/[^\s<]+[^\s<.,;:)])/g,
    `<a href="$1" style="color:${COLORI.titolo};text-decoration:underline">$1</a>`,
  )

/**
 * Gmail e Apple Mail trasformano da soli gli indirizzi in link blu. Un link nostro, con colore
 * esplicito e sottolineato, li tiene nei colori del piede.
 */
const INDIRIZZO = 'Via Accademia Albertina 6, 10123 Torino'
const senzaLinkAutomatici = (html: string) =>
  html.replace(
    INDIRIZZO,
    `<a href="https://www.google.com/maps/search/?api=1&amp;query=${encodeURIComponent(`Accademia Albertina, ${INDIRIZZO}`)}" style="color:${COLORI.footerTesto};text-decoration:underline">${INDIRIZZO}</a>`,
  )

const PIEDE_TESTO = [
  'Questa email è automatica: non rispondere. Per domande scrivi alla segreteria didattica.',
  `Accademia Albertina di Belle Arti di Torino · ${INDIRIZZO}`,
]

/** Versione solo testo, per i programmi che non mostrano l'HTML e per il registro. */
export function testoEmail(c: ContenutoEmail): string {
  return [
    c.saluto,
    ...c.paragrafi,
    c.dettagli?.length ? c.dettagli.map((d) => `${d.etichetta}: ${d.valore}`).join('\n') : '',
    c.pulsante ? `${c.pulsante.testo}: ${c.pulsante.url}` : '',
    ...(c.note ?? []),
    PIEDE_TESTO.join('\n'),
  ]
    .filter(Boolean)
    .join('\n\n')
}

/** Versione HTML con intestazione, riquadro dei dettagli, pulsante e piè di pagina. */
export function htmlEmail(c: ContenutoEmail): string {
  const p = (testo: string, extra = '') =>
    `<p style="margin:0 0 16px;font-family:${FONT};font-size:16px;line-height:1.6;color:${COLORI.testo};${extra}">${conLink(testo)}</p>`

  const dettagli = c.dettagli?.length
    ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:8px 0 24px;background:${COLORI.pannello};border-left:4px solid ${COLORI.istituzionale}">
        <tr><td style="padding:16px 20px">
          ${c.dettagli
            .map(
              (d) => `<p style="margin:0 0 8px;font-family:${FONT};font-size:15px;line-height:1.5;color:${COLORI.testo}">
            <span style="display:block;font-size:12px;letter-spacing:0.08em;text-transform:uppercase;color:${COLORI.secondario}">${escape(d.etichetta)}</span>
            <strong style="font-weight:600;color:${COLORI.titolo}">${escape(d.valore)}</strong></p>`,
            )
            .join('\n')}
        </td></tr>
      </table>`
    : ''

  const pulsante = c.pulsante
    ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:8px 0 24px">
        <tr><td style="background:${COLORI.pulsante}">
          <a href="${escape(c.pulsante.url)}" style="display:inline-block;padding:14px 24px;font-family:${FONT};font-size:16px;font-weight:600;color:#ffffff;text-decoration:none">${escape(c.pulsante.testo)}</a>
        </td></tr>
      </table>`
    : ''

  const note = (c.note ?? [])
    .map((n) => p(n, `font-size:14px;color:${COLORI.secondario}`))
    .join('\n')

  return `<!doctype html>
<html lang="it">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light">
<title>${escape(c.titolo)}</title>
</head>
<body style="margin:0;padding:0;background:${COLORI.sfondo}">
<div style="display:none;max-height:0;overflow:hidden">${escape(c.paragrafi[0] ?? c.titolo)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${COLORI.sfondo}">
  <tr><td align="center" style="padding:24px 12px">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border:1px solid ${COLORI.bordo}">
      <tr><td style="background:${COLORI.istituzionale};padding:20px 32px">
        <img src="cid:${CID_LOGO}" width="160" height="73" alt="Accademia Albertina di Belle Arti di Torino" style="display:block;border:0;width:160px;height:auto;color:#ffffff;font-family:${FONT};font-size:14px">
      </td></tr>
      <tr><td style="padding:32px 32px 8px">
        <p style="margin:0 0 8px;font-family:${FONT};font-size:12px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;color:${COLORI.istituzionale}">${escape(c.occhiello)}</p>
        <h1 style="margin:0 0 24px;font-family:${FONT};font-size:26px;line-height:1.2;font-weight:600;letter-spacing:-0.015em;color:${COLORI.titolo}">${escape(c.titolo)}</h1>
        ${p(c.saluto)}
        ${c.paragrafi.map((t) => p(t)).join('\n')}
        ${dettagli}
        ${pulsante}
        ${note}
      </td></tr>
      <tr><td style="background:${COLORI.footer};padding:20px 32px">
        ${PIEDE_TESTO.map(
          (t) =>
            `<p style="margin:0 0 6px;font-family:${FONT};font-size:13px;line-height:1.5;color:${COLORI.footerTesto}">${senzaLinkAutomatici(escape(t))}</p>`,
        ).join('\n')}
      </td></tr>
    </table>
  </td></tr>
</table>
</body>
</html>`
}

/** Logo da allegare all'email, richiamato nell'HTML con cid:logo-albertina. */
export const allegatoLogo = () => ({
  filename: 'logo-albertina.png',
  content: Buffer.from(LOGO_EMAIL_PNG_BASE64, 'base64'),
  contentType: 'image/png',
  cid: CID_LOGO,
})
