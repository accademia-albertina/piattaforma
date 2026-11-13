/**
 * Stato del collegamento a Drive: refresh token cifrato nel globale "drive-connessione",
 * access token in memoria (dura un'ora), sottocartella "media" creata al primo caricamento.
 */
import type { Payload } from 'payload'

import { cifra, decifra } from './cifratura'
import {
  clientDrive,
  driveConfigurato,
  ErroreDrive,
  idCartellaRadice,
  rinnovaToken,
  type ClientDrive,
} from './api'

const GLOBALE = 'drive-connessione' as const

export type StatoDrive = {
  email?: string | null
  tokenCifrato?: string | null
  collegatoIl?: string | null
  collegatoDa?: string | null
  cartellaMedia?: string | null
  cartellaRadice?: string | null
  errore?: string | null
}

let tokenInMemoria: { refresh: string; accessToken: string; scade: number } | null = null

export async function leggiStato(payload: Payload): Promise<StatoDrive> {
  return (await payload.findGlobal({
    slug: GLOBALE,
    overrideAccess: true,
    depth: 0,
  })) as StatoDrive
}

async function salvaStato(payload: Payload, data: Partial<StatoDrive>) {
  await payload.updateGlobal({ slug: GLOBALE, data, overrideAccess: true, depth: 0 })
}

export async function salvaCollegamento(
  payload: Payload,
  o: { email: string; refreshToken: string; accessToken: string; scade: number; da: string },
) {
  await salvaStato(payload, {
    email: o.email,
    tokenCifrato: cifra(o.refreshToken),
    collegatoIl: new Date().toISOString(),
    collegatoDa: o.da,
    cartellaMedia: null,
    cartellaRadice: null,
    errore: null,
  })
  tokenInMemoria = { refresh: o.refreshToken, accessToken: o.accessToken, scade: o.scade }
}

/** Toglie il collegamento e restituisce il refresh token (da revocare presso Google). */
export async function rimuoviCollegamento(payload: Payload) {
  const stato = await leggiStato(payload)
  await salvaStato(payload, {
    email: null,
    tokenCifrato: null,
    collegatoIl: null,
    collegatoDa: null,
    cartellaMedia: null,
    cartellaRadice: null,
    errore: null,
  })
  tokenInMemoria = null
  return stato.tokenCifrato ? decifra(stato.tokenCifrato) : null
}

/**
 * Client Drive pronto all'uso, o null se Drive non è configurato o non è collegato
 * (in quel caso i file restano sul disco del server, come prima).
 */
export async function driveCollegato(payload: Payload): Promise<ClientDrive | null> {
  if (!driveConfigurato()) return null
  const stato = await leggiStato(payload)
  const refresh = stato.tokenCifrato ? decifra(stato.tokenCifrato) : null
  if (!refresh) return null

  const token = async () => {
    if (tokenInMemoria?.refresh === refresh && tokenInMemoria.scade - 60_000 > Date.now()) {
      return tokenInMemoria.accessToken
    }
    try {
      const nuovo = await rinnovaToken(refresh)
      tokenInMemoria = { refresh, ...nuovo }
      if (stato.errore) await salvaStato(payload, { errore: null })
      return nuovo.accessToken
    } catch (e) {
      if (e instanceof ErroreDrive && e.scollegato) {
        await salvaStato(payload, {
          errore: 'Google non accetta più il collegamento (permesso revocato o password cambiata).',
        })
      }
      throw e
    }
  }
  return clientDrive(token)
}

/** ID della sottocartella "media" dentro DRIVE_ID (creata se manca, poi ricordata). */
export async function cartellaMedia(payload: Payload, drive: ClientDrive) {
  const radice = idCartellaRadice()
  const stato = await leggiStato(payload)
  if (stato.cartellaMedia && stato.cartellaRadice === radice) return stato.cartellaMedia
  const id = await drive.cartella('media', radice)
  await salvaStato(payload, { cartellaMedia: id, cartellaRadice: radice })
  return id
}
