import { getPayload, Payload } from 'payload'
import config from '@/payload.config'

import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { trovaAvvisi, ultimiAvvisi } from '@/lib/avvisi'
import { avvisiDellaScuola } from '@/lib/scuole'
import { avvisiAmmissioni } from '@/lib/avvisi-ammissioni'
import type { Avviso, Scuola, User } from '@/payload-types'
import { convertiAvvisiAmmissioni } from '@/seed/avvisi-ammissioni'

let payload: Payload

const PASSWORD = 'Password-di-prova-1!'
const ORA = new Date().toISOString()

async function utente(email: string, roles: User['roles']) {
  return payload.create({
    collection: 'users',
    data: { email: `${email}@albertina.academy`, password: PASSWORD, roles },
  })
}

/** Rilegge l'utente come fa l'accesso: così si calcolano le scuole coordinate. */
const rileggi = (u: User) => payload.findByID({ collection: 'users', id: u.id, depth: 0 })

const errore = (p: Promise<unknown>) =>
  p
    .then(() => null)
    .catch((e: { data?: { errors?: { message: string }[] }; message?: string }) =>
      JSON.stringify(e?.data?.errors ?? e?.message ?? e),
    )

const idScuole = (a: Pick<Avviso, 'scuole'>) =>
  (a.scuole ?? []).map((s) => (typeof s === 'object' ? s.id : s))

describe('Avvisi di ammissione dei coordinatori di scuola', () => {
  let vice: User
  let coordinatore: User
  let docente: User
  let pittura: Scuola
  let scultura: Scuola
  let profiloCoordinatore: number
  let profiloDocente: number

  const pulisci = async () => {
    await payload.delete({
      collection: 'avvisi',
      where: { titolo: { like: '[amm]' } },
      overrideAccess: true,
    })
    await payload.delete({
      collection: 'scuole',
      where: { nome: { like: 'Prova ammissioni' } },
      overrideAccess: true,
    })
    await payload.delete({
      collection: 'docenti',
      where: { cognome: { equals: 'Provaammissioni' } },
      overrideAccess: true,
    })
    await payload.delete({
      collection: 'users',
      where: { email: { like: 'amm.' } },
      overrideAccess: true,
    })
  }

  beforeAll(async () => {
    payload = await getPayload({ config: await config })
    await pulisci()
    vice = await utente('amm.vice', ['vicedirezione'])
    coordinatore = await utente('amm.coordinatore', ['docente'])
    docente = await utente('amm.docente', ['docente'])
    pittura = await payload.create({
      collection: 'scuole',
      data: { nome: 'Prova ammissioni Pittura' },
      overrideAccess: true,
    })
    scultura = await payload.create({
      collection: 'scuole',
      data: { nome: 'Prova ammissioni Scultura' },
      overrideAccess: true,
    })
    profiloCoordinatore = (
      await payload.create({
        collection: 'docenti',
        data: { nome: 'Coordinatore', cognome: 'Provaammissioni', account: coordinatore.id },
        overrideAccess: true,
      })
    ).id
    profiloDocente = (
      await payload.create({
        collection: 'docenti',
        data: { nome: 'Docente', cognome: 'Provaammissioni', account: docente.id },
        overrideAccess: true,
      })
    ).id
    await payload.update({
      collection: 'scuole',
      id: pittura.id,
      data: { coordinatoreScuola: profiloCoordinatore },
      overrideAccess: true,
    })
    coordinatore = await rileggi(coordinatore)
    docente = await rileggi(docente)
  })

  afterAll(pulisci)

  it('il coordinatore risulta tale solo per la sua scuola', () => {
    expect(coordinatore.scuoleCoordinate).toEqual([pittura.id])
    expect(docente.scuoleCoordinate ?? []).toEqual([])
  })

  it('il coordinatore pubblica in Ammissioni e la scuola si imposta da sola', async () => {
    const a = await payload.create({
      collection: 'avvisi',
      data: {
        titolo: '[amm] Colloqui di Pittura',
        categorie: ['ammissioni'],
        pubblicatoIl: ORA,
        _status: 'published',
      },
      user: coordinatore,
      overrideAccess: false,
      draft: false,
    })
    expect(idScuole(a)).toEqual([pittura.id])
  })

  it('il coordinatore non può scegliere un’altra scuola', async () => {
    const a = await payload.create({
      collection: 'avvisi',
      data: {
        titolo: '[amm] Tentativo su Scultura',
        categorie: ['ammissioni'],
        scuole: [scultura.id],
        pubblicatoIl: ORA,
        _status: 'published',
      },
      user: coordinatore,
      overrideAccess: false,
      draft: false,
    })
    expect(idScuole(a)).toEqual([pittura.id])
  })

  it('un docente che non coordina non può usare Ammissioni', async () => {
    const msg = await errore(
      payload.create({
        collection: 'avvisi',
        data: {
          titolo: '[amm] Docente qualsiasi',
          categorie: ['ammissioni'],
          scuole: [pittura.id],
          pubblicatoIl: ORA,
        },
        user: docente,
        overrideAccess: false,
        draft: false,
      }),
    )
    expect(msg).toContain('non può pubblicare in: Ammissioni')
  })

  it('Ammissioni non si combina con altre categorie', async () => {
    const msg = await errore(
      payload.create({
        collection: 'avvisi',
        data: {
          titolo: '[amm] Anche in esami',
          categorie: ['ammissioni', 'esami'],
          pubblicatoIl: ORA,
        },
        user: coordinatore,
        overrideAccess: false,
        draft: false,
      }),
    )
    expect(msg).toContain('non si combina con altre categorie')
  })

  it('la vicedirezione sceglie la scuola, che è obbligatoria', async () => {
    const msg = await errore(
      payload.create({
        collection: 'avvisi',
        data: { titolo: '[amm] Senza scuola', categorie: ['ammissioni'], pubblicatoIl: ORA },
        user: vice,
        overrideAccess: false,
        draft: false,
      }),
    )
    expect(msg).toContain('devono indicare la scuola')
    const a = await payload.create({
      collection: 'avvisi',
      data: {
        titolo: '[amm] Scultura dalla vicedirezione',
        categorie: ['ammissioni'],
        scuole: [scultura.id],
        pubblicatoIl: ORA,
        _status: 'published',
      },
      user: vice,
      overrideAccess: false,
      draft: false,
    })
    expect(idScuole(a)).toEqual([scultura.id])
  })

  it('il pubblico li trova in /avvisi ma non in home né nella pagina della scuola', async () => {
    const archivio = await trovaAvvisi({ categoria: 'ammissioni', pagina: 1 }, [])
    expect(archivio.docs.map((a) => a.titolo)).toContain('[amm] Colloqui di Pittura')
    const tutti = await payload.find({
      collection: 'avvisi',
      where: { titolo: { equals: '[amm] Colloqui di Pittura' } },
      overrideAccess: false,
    })
    expect(tutti.totalDocs).toBe(1)
    const home = await ultimiAvvisi(50)
    expect(home.some((a) => a.titolo.startsWith('[amm]'))).toBe(false)
    const esami = await ultimiAvvisi(50, ['ammissioni', 'esami'])
    expect(esami.some((a) => a.titolo.startsWith('[amm]'))).toBe(false)
    const scuola = await avvisiDellaScuola(pittura.id, 50)
    expect(scuola.some((a) => a.titolo.startsWith('[amm]'))).toBe(false)
  })

  it('la pagina Ammissioni li mostra per scuola, senza bozze né scaduti', async () => {
    const ieri = new Date(Date.now() - 86_400_000).toISOString()
    const domani = new Date(Date.now() + 86_400_000).toISOString()
    for (const [titolo, extra] of [
      ['[amm] Scaduto', { visibileFinoAl: ieri, _status: 'published' }],
      ['[amm] Fino a domani', { visibileFinoAl: domani, _status: 'published' }],
      ['[amm] Bozza', { _status: 'draft' }],
    ] as const) {
      await payload.create({
        collection: 'avvisi',
        data: {
          titolo,
          categorie: ['ammissioni'],
          scuole: [pittura.id],
          pubblicatoIl: ORA,
          ...extra,
        },
        overrideAccess: true,
        draft: extra._status === 'draft',
      })
    }
    const gruppi = (await avvisiAmmissioni()).filter((g) =>
      g.scuola.nome.startsWith('Prova ammissioni'),
    )
    expect(gruppi.map((g) => g.scuola.nome)).toEqual([
      'Prova ammissioni Pittura',
      'Prova ammissioni Scultura',
    ])
    const titoli = gruppi[0].avvisi.map((a) => a.titolo)
    expect(titoli).toContain('[amm] Colloqui di Pittura')
    expect(titoli).toContain('[amm] Fino a domani')
    expect(titoli).not.toContain('[amm] Scaduto')
    expect(titoli).not.toContain('[amm] Bozza')
  })

  it('cambiato il coordinatore, il permesso passa al nuovo', async () => {
    const { docs } = await payload.find({
      collection: 'avvisi',
      where: { titolo: { equals: '[amm] Colloqui di Pittura' } },
      overrideAccess: true,
    })
    const avviso = docs[0]
    await payload.update({
      collection: 'scuole',
      id: pittura.id,
      data: { coordinatoreScuola: profiloDocente },
      overrideAccess: true,
    })
    const vecchio = await rileggi(coordinatore)
    const nuovo = await rileggi(docente)
    expect(vecchio.scuoleCoordinate ?? []).toEqual([])
    expect(nuovo.scuoleCoordinate).toEqual([pittura.id])

    // Il nuovo coordinatore modifica l'avviso scritto dal precedente…
    const aggiornato = await payload.update({
      collection: 'avvisi',
      id: avviso.id,
      data: { titolo: '[amm] Colloqui di Pittura (aggiornato)' },
      user: nuovo,
      overrideAccess: false,
      draft: false,
    })
    expect(aggiornato.titolo).toBe('[amm] Colloqui di Pittura (aggiornato)')
    // …il vecchio non può più né modificarlo né scriverne di nuovi
    expect(
      await errore(
        payload.update({
          collection: 'avvisi',
          id: avviso.id,
          data: { titolo: '[amm] Ancora io' },
          user: vecchio,
          overrideAccess: false,
          draft: false,
        }),
      ),
    ).not.toBeNull()
    expect(
      await errore(
        payload.create({
          collection: 'avvisi',
          data: { titolo: '[amm] Ancora io', categorie: ['ammissioni'], pubblicatoIl: ORA },
          user: vecchio,
          overrideAccess: false,
          draft: false,
        }),
      ),
    ).toContain('non può pubblicare in: Ammissioni')
  })
})

describe('Pagina Ammissioni: dalla fisarmonica statica al blocco', () => {
  const rt = (t: string) =>
    ({
      root: {
        type: 'root',
        format: '',
        indent: 0,
        version: 1,
        direction: 'ltr',
        children: [
          {
            type: 'paragraph',
            format: '',
            indent: 0,
            version: 1,
            direction: 'ltr',
            textFormat: 0,
            children: [
              {
                type: 'text',
                text: t,
                format: 0,
                mode: 'normal',
                style: '',
                detail: 0,
                version: 1,
              },
            ],
          },
        ],
      },
    }) as never

  const pulisci = async () => {
    await payload.delete({
      collection: 'pagine',
      where: { percorso: { in: ['didattica/ammissioni', 'didattica'] } },
      overrideAccess: true,
    })
    await payload.delete({
      collection: 'avvisi',
      where: { titolo: { like: 'Esami di ammissione' }, categorie: { contains: 'ammissioni' } },
      overrideAccess: true,
    })
    await payload.delete({
      collection: 'scuole',
      where: { nome: { equals: 'Prova conversione d’Arte' } },
      overrideAccess: true,
    })
  }

  beforeAll(async () => {
    payload = await getPayload({ config: await config })
    await pulisci()
  })
  afterAll(pulisci)

  it('le voci diventano avvisi della scuola e la pagina usa il blocco', async () => {
    const scuola = await payload.create({
      collection: 'scuole',
      data: { nome: 'Prova conversione d’Arte' },
      overrideAccess: true,
    })
    const didattica = await payload.create({
      collection: 'pagine',
      data: { titolo: 'Didattica', slug: 'didattica', _status: 'published' },
      overrideAccess: true,
      draft: false,
    })
    await payload.create({
      collection: 'pagine',
      data: {
        titolo: 'Ammissioni',
        slug: 'ammissioni',
        genitore: didattica.id,
        _status: 'published',
        blocchi: [
          { blockType: 'testo', testo: rt('Introduzione') },
          {
            blockType: 'fisarmonica',
            titolo: 'Avvisi dei coordinatori',
            voci: [
              { titolo: "Prova conversione d'Arte", testo: rt('Colloqui il 16 settembre.') },
              { titolo: 'Scuola che non esiste', testo: rt('Saltata.') },
            ],
          },
        ],
      },
      overrideAccess: true,
      draft: false,
    })

    await convertiAvvisiAmmissioni(payload)
    // Una seconda volta non fa niente
    await convertiAvvisiAmmissioni(payload)

    const pagina = (
      await payload.find({
        collection: 'pagine',
        where: { percorso: { equals: 'didattica/ammissioni' } },
        overrideAccess: true,
      })
    ).docs[0]
    expect(pagina.blocchi?.map((b) => b.blockType)).toEqual(['testo', 'avvisiAmmissioni'])
    const avvisi = await payload.find({
      collection: 'avvisi',
      where: { categorie: { contains: 'ammissioni' }, scuole: { in: [scuola.id] } },
      overrideAccess: true,
    })
    expect(avvisi.totalDocs).toBe(1)
    expect(JSON.stringify(avvisi.docs[0].contenuto)).toContain('Colloqui il 16 settembre.')
  })
})
