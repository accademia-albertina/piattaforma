import { cache } from 'react'

import { risolviLinks } from './link'
import {
  MENU_FOOTER,
  MENU_IN_EVIDENZA,
  MENU_LEGALE,
  MENU_PRINCIPALE,
  MENU_SERVIZI,
  SOCIAL,
  type GruppoMenu,
  type VoceMenu,
} from './navigazione'
import { payloadClient } from './payload'

export type MenuSito = {
  servizi: { sinistra: VoceMenu[]; destra: VoceMenu[] }
  inEvidenza: VoceMenu[]
  colonne: GruppoMenu[][]
  footer: { link: VoceMenu[]; social: VoceMenu[]; legale: VoceMenu[] }
}

const oppure = <T>(valore: T[], predefinito: T[]) => (valore.length > 0 ? valore : predefinito)

/** Menu modificabili dal pannello; ogni elenco vuoto ricade sui valori predefiniti. */
export const menuSito = cache(async (): Promise<MenuSito> => {
  // Senza database (es. build senza servizi) il sito usa i menu predefiniti.
  const n = await payloadClient()
    .then((payload) => payload.findGlobal({ slug: 'navigazione', depth: 1, overrideAccess: false }))
    .catch(() => null)

  const colonne = (n?.colonne ?? [])
    .map((c) =>
      (c.gruppi ?? [])
        .map((g) => ({ titolo: g.titolo, voci: risolviLinks(g.voci) }))
        .filter((g) => g.voci.length > 0),
    )
    .filter((c) => c.length > 0)

  return {
    servizi: {
      sinistra: oppure(risolviLinks(n?.serviziSinistra), MENU_SERVIZI.sinistra),
      destra: oppure(risolviLinks(n?.serviziDestra), MENU_SERVIZI.destra),
    },
    inEvidenza: oppure(risolviLinks(n?.inEvidenza), MENU_IN_EVIDENZA),
    colonne: oppure(colonne, MENU_PRINCIPALE),
    footer: {
      link: oppure(risolviLinks(n?.footerLink), MENU_FOOTER),
      social: oppure(risolviLinks(n?.footerSocial), SOCIAL),
      legale: oppure(risolviLinks(n?.footerLegale), MENU_LEGALE),
    },
  }
})
