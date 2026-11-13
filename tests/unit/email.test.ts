import { describe, expect, it } from 'vitest'

import { componi, elencoIndirizzi, mittente, testoPerRegistro } from '@/lib/email'
import { htmlEmail, testoEmail, type ContenutoEmail } from '@/lib/email-modello'
import { erroreDimensione, LIMITE_MB } from '@/lib/limiti-upload'

const MB = 1024 * 1024

describe('Email', () => {
  it('separa nome e indirizzo del mittente', () => {
    expect(mittente('Accademia Albertina <noreply@albertina.academy>')).toEqual({
      name: 'Accademia Albertina',
      address: 'noreply@albertina.academy',
    })
    expect(mittente('noreply@albertina.academy')).toEqual({
      name: 'Accademia Albertina',
      address: 'noreply@albertina.academy',
    })
    expect(mittente('')).toEqual({
      name: 'Accademia Albertina',
      address: 'noreply@albertina.academy',
    })
  })

  it('elenca i destinatari in qualunque forma', () => {
    expect(elencoIndirizzi('a@x.it')).toBe('a@x.it')
    expect(elencoIndirizzi(['a@x.it', { name: 'B', address: 'b@x.it' }])).toBe('a@x.it, b@x.it')
    expect(elencoIndirizzi(undefined)).toBe('')
  })

  it('nel registro toglie i tag e i codici di accesso', () => {
    const testo = testoPerRegistro({
      html: '<p>Reimposta la password: <a href="https://sito/admin/reset/abc123">qui</a></p>',
    })
    expect(testo).not.toContain('<')
    expect(testoPerRegistro({ text: 'https://sito/admin/reset/abc123 e ?token=xyz' })).toBe(
      'https://sito/admin/reset/[nascosto] e ?token=[nascosto]',
    )
  })

  const contenuto: ContenutoEmail = {
    occhiello: 'Iscrizione ai corsi',
    titolo: 'Iscrizione registrata',
    saluto: 'Gentile <Mario>,',
    paragrafi: ['la tua iscrizione è registrata.'],
    dettagli: [{ etichetta: 'Corso', valore: 'Anatomia & disegno' }],
    pulsante: { testo: 'Vai a La mia area', url: 'https://sito/la-mia-area' },
  }

  it('il modello HTML ha logo incorporato, dati e testo protetto', () => {
    const html = htmlEmail(contenuto)
    expect(html).toContain('src="cid:logo-albertina"')
    expect(html).toContain('lang="it"')
    expect(html).toContain('Gentile &lt;Mario&gt;,')
    expect(html).toContain('Anatomia &amp; disegno')
    expect(html).toContain('href="https://sito/la-mia-area"')
  })

  it('la versione testo ha gli stessi dati', () => {
    const testo = testoEmail(contenuto)
    expect(testo).toContain('Corso: Anatomia & disegno')
    expect(testo).toContain('Vai a La mia area: https://sito/la-mia-area')
    expect(testo).toContain('Questa email è automatica')
  })

  it('allega il logo richiamato dall’HTML', () => {
    const email = componi({ to: 'a@x.it', subject: 'Prova', contenuto })
    const [logo] = email.attachments as { cid: string; content: Buffer }[]
    expect(logo.cid).toBe('logo-albertina')
    expect(logo.content.subarray(1, 4).toString()).toBe('PNG')
  })
})

describe('Limite dei caricamenti', () => {
  const redazione = { roles: ['redazione'] }
  const admin = { roles: ['admin'] }
  const pdf = (mb: number) => ({ size: mb * MB, mimetype: 'application/pdf' })
  const foto = (mb: number) => ({ size: mb * MB, mimetype: 'image/jpeg' })

  it('blocca i file oltre il limite per chi non è admin', () => {
    expect(erroreDimensione(pdf(LIMITE_MB.pdf + 1), redazione)).toMatch(/massimo è 10 MB/)
    expect(erroreDimensione(foto(LIMITE_MB.immagine + 1), redazione)).toMatch(/massimo è 20 MB/)
  })

  it('lascia passare i file nel limite e tutto agli admin', () => {
    expect(erroreDimensione(pdf(LIMITE_MB.pdf), redazione)).toBeNull()
    expect(erroreDimensione(foto(15), redazione)).toBeNull()
    expect(erroreDimensione(pdf(40), admin)).toBeNull()
    expect(erroreDimensione(undefined, redazione)).toBeNull()
  })
})
