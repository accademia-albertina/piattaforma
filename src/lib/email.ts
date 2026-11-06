import { nodemailerAdapter } from '@payloadcms/email-nodemailer'
import type { PayloadRequest } from 'payload'

/**
 * Email in uscita via TurboSMTP. Senza SMTP_HOST non si spedisce nulla: Payload scrive le email
 * nel log (sviluppo, test, anteprima). EMAIL_SOLO_A dirotta tutte le email a un solo indirizzo,
 * per provare l'invio in anteprima senza scrivere agli studenti.
 */
export function adattatoreEmail() {
  const host = process.env.SMTP_HOST
  if (!host) return undefined
  const port = Number(process.env.SMTP_PORT || 587)
  return nodemailerAdapter({
    defaultFromAddress: process.env.EMAIL_MITTENTE || 'noreply@albertina.academy',
    defaultFromName: 'Accademia Albertina',
    overrideRecipientAddress: process.env.EMAIL_SOLO_A || undefined,
    skipVerify: true,
    transportOptions: {
      host,
      port,
      secure: port === 465,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    },
  })
}

export type Messaggio = { to: string; subject: string; text: string }

/**
 * Spedisce senza far aspettare chi ha fatto l'azione: un errore SMTP finisce nel log e non
 * annulla l'iscrizione. `req.context.senzaEmail` la salta (import, test, operazioni in blocco).
 */
export function spedisci(req: PayloadRequest, messaggio: Messaggio | null) {
  if (!messaggio?.to || req.context?.senzaEmail) return
  void req.payload
    .sendEmail({ ...messaggio, html: testoInHtml(messaggio.text) })
    .catch((err: unknown) =>
      req.payload.logger.error({ err, msg: `Email non spedita a ${messaggio.to}` }),
    )
}

const escape = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

/** Versione HTML minima del testo: paragrafi e link cliccabili, niente grafica. */
export function testoInHtml(testo: string) {
  const corpo = testo
    .split(/\n{2,}/)
    .map((p) =>
      escape(p)
        .replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1">$1</a>')
        .replace(/\n/g, '<br>'),
    )
    .map((p) => `<p>${p}</p>`)
    .join('\n')
  return `<div style="font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.5;color:#1c3038">${corpo}</div>`
}
