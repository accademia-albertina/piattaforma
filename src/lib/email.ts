import { nodemailerAdapter } from '@payloadcms/email-nodemailer'
import type { EmailAdapter, PayloadRequest, SendEmailOptions } from 'payload'

import { allegatoLogo, htmlEmail, testoEmail, type ContenutoEmail } from '@/lib/email-modello'
import { registraEmail } from '@/lib/registro-email'

type Indirizzo = { name: string; address: string }

/**
 * Mittente da EMAIL_MITTENTE: accetta sia "noreply@…" sia "Accademia Albertina <noreply@…>".
 * Senza separarli il nome finirebbe due volte nell'intestazione From.
 */
export function mittente(valore = process.env.EMAIL_MITTENTE): Indirizzo {
  const testo = valore?.trim() || 'noreply@albertina.academy'
  const conNome = /^\s*"?([^"<]*?)"?\s*<([^>]+)>\s*$/.exec(testo)
  if (conNome) return { name: conNome[1].trim() || 'Accademia Albertina', address: conNome[2] }
  return { name: 'Accademia Albertina', address: testo }
}

/** Indirizzi di un campo to/cc/bcc in forma leggibile ("a@x, b@y"). */
export function elencoIndirizzi(campo: SendEmailOptions['to']): string {
  if (!campo) return ''
  const lista = (Array.isArray(campo) ? campo : [campo]).flat() as (
    | string
    | { address?: string }
  )[]
  return lista
    .map((v) => (typeof v === 'string' ? v : (v?.address ?? '')))
    .filter(Boolean)
    .join(', ')
}

/** Testo per il registro: senza tag HTML e senza i link con codici di accesso (es. reset password). */
export function testoPerRegistro(m: Pick<SendEmailOptions, 'text' | 'html'>): string {
  const grezzo =
    typeof m.text === 'string'
      ? m.text
      : typeof m.html === 'string'
        ? m.html.replace(/<(br|\/p|\/div)\s*\/?>/gi, '\n').replace(/<[^>]+>/g, ' ')
        : ''
  return grezzo
    .replace(/(\/reset\/|[?&]token=)[^\s"'<&]+/gi, '$1[nascosto]')
    .replace(/[ \t]+/g, ' ')
    .trim()
    .slice(0, 5000)
}

type Interno = ReturnType<EmailAdapter>

/**
 * Avvolge l'adattatore SMTP: ogni email (iscrizioni, recupero password, ecc.) finisce nel
 * registro “Email inviate”, con l'esito. Senza SMTP non parte nulla e il registro lo dice.
 */
export function conRegistro(
  smtp: EmailAdapter | null,
  opzioni: { soloA?: string } = {},
): EmailAdapter {
  const da = mittente()
  return ({ payload }) => {
    const interno: Interno | null = smtp ? smtp({ payload }) : null
    return {
      name: interno ? 'turbosmtp' : 'solo-registro',
      defaultFromAddress: da.address,
      defaultFromName: da.name,
      sendEmail: async (messaggio) => {
        const base = {
          destinatario: elencoIndirizzi(messaggio.to),
          consegnataA: interno ? opzioni.soloA || elencoIndirizzi(messaggio.to) : '',
          oggetto: messaggio.subject || '(senza oggetto)',
          testo: testoPerRegistro(messaggio),
        }
        if (!interno) {
          payload.logger.info(`Email non spedita (SMTP non configurato): ${base.oggetto}`)
          await registraEmail(payload, { ...base, esito: 'non-spedita' })
          return null
        }
        try {
          const info = (await interno.sendEmail(messaggio)) as {
            messageId?: string
            response?: string
          } | null
          await registraEmail(payload, {
            ...base,
            esito: 'inviata',
            idMessaggio: info?.messageId,
            risposta: info?.response,
          })
          return info
        } catch (err) {
          await registraEmail(payload, {
            ...base,
            esito: 'errore',
            errore: err instanceof Error ? err.message : String(err),
          })
          throw err
        }
      },
    }
  }
}

/**
 * Email in uscita via TurboSMTP. Senza SMTP_HOST non si spedisce nulla: l'email resta solo nel
 * registro (sviluppo, test). EMAIL_SOLO_A dirotta tutte le email a un solo indirizzo, per provare
 * l'invio in anteprima senza scrivere agli studenti.
 */
export async function adattatoreEmail(): Promise<EmailAdapter> {
  const host = process.env.SMTP_HOST
  const soloA = process.env.EMAIL_SOLO_A?.trim() || undefined
  if (!host) return conRegistro(null)
  const port = Number(process.env.SMTP_PORT || 587)
  const da = mittente()
  const smtp = await nodemailerAdapter({
    defaultFromAddress: da.address,
    defaultFromName: da.name,
    overrideRecipientAddress: soloA,
    skipVerify: true,
    transportOptions: {
      host,
      port,
      secure: port === 465,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
      // Un server SMTP che non risponde non deve tenere aperta la richiesta per minuti
      connectionTimeout: 15_000,
      greetingTimeout: 15_000,
      socketTimeout: 30_000,
    },
  })
  return conRegistro(smtp, { soloA })
}

export type Messaggio = { to: string; subject: string; contenuto: ContenutoEmail }

/** Email pronta per Payload: testo, HTML del modello e logo incorporato. */
export function componi(messaggio: Messaggio): SendEmailOptions {
  return {
    to: messaggio.to,
    subject: messaggio.subject,
    text: testoEmail(messaggio.contenuto),
    html: htmlEmail(messaggio.contenuto),
    attachments: [allegatoLogo()],
  }
}

/**
 * Spedisce senza far aspettare chi ha fatto l'azione: un errore SMTP finisce nel registro e
 * non annulla l'iscrizione. `req.context.senzaEmail` la salta (import, test, operazioni in blocco).
 */
export function spedisci(req: PayloadRequest, messaggio: Messaggio | null) {
  if (!messaggio?.to || req.context?.senzaEmail) return
  void req.payload
    .sendEmail(componi(messaggio))
    .catch((err: unknown) =>
      req.payload.logger.error({ err, msg: `Email non spedita a ${messaggio.to}` }),
    )
}
