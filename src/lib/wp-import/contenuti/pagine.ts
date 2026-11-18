/**
 * Pagine istituzionali da WordPress → blocchi delle Pagine (come scripts/wp/converti-pagine.ts
 * per l'importazione iniziale). I link ai file restano indirizzi di WordPress: li sostituisce poi
 * la mappa dei file importati; i documenti incorporati diventano righe { file, url }.
 */
import type { SanitizedConfig } from 'payload'

import type { Pagina } from '@/payload-types'

import { htmlInLexical, pulisciHtml } from './converti'
import type { BloccoGrezzo } from './pagine-html'

/** Cambia quando cambia la conversione delle pagine: quelle non toccate si riallineano. */
export const VERSIONE_PAGINE = 'p4'

// I link alle pagine del sito restano relativi: la correzione dei link li renderebbe assoluti.
// Il prefisso finisce con "/": nessun altro host può corrispondere.
const INTERNO = 'https://interno.invalid/'

type NodoLexical = { type?: string; children?: NodoLexical[]; fields?: { url?: string } }

function relativi(n: NodoLexical) {
  n.children?.forEach(relativi)
  if (n.type === 'link' && n.fields?.url?.startsWith(INTERNO))
    n.fields.url = `/${n.fields.url.slice(INTERNO.length)}`
}

async function lexical(html: string, config: SanitizedConfig) {
  const pulito = pulisciHtml(html)
    .replace(/href="\/(?!\/)/g, `href="${INTERNO}`)
    // ancore interne della vecchia pagina
    .replace(/<a href="#[^"]*"[^>]*>([\s\S]*?)<\/a>/g, '$1')
  const valore = await htmlInLexical(pulito, config)
  relativi((valore as unknown as { root: NodoLexical }).root)
  return valore
}

export const tronca = (s: string, n: number) =>
  s.length > n ? `${s.slice(0, n - 1).replace(/\s+\S*$/, '')}…` : s

type Blocco = NonNullable<Pagina['blocchi']>[number]

/** Blocchi grezzi → blocchi della collezione Pagine. */
export async function blocchiPagina(
  grezzi: BloccoGrezzo[],
  config: SanitizedConfig,
): Promise<Blocco[]> {
  const out: Blocco[] = []
  for (const b of grezzi) {
    switch (b.tipo) {
      case 'testo':
        out.push({ blockType: 'testo', testo: (await lexical(b.html, config)) as never })
        break
      case 'fisarmonica': {
        const voci = []
        for (const v of b.voci)
          voci.push({
            titolo: v.titolo || 'Dettagli',
            testo: (await lexical(v.html, config)) as never,
          })
        out.push({ blockType: 'fisarmonica', voci })
        break
      }
      case 'link':
        out.push({
          blockType: 'link',
          voci: b.voci.map((v) => ({
            etichetta: tronca(v.etichetta, 200),
            tipo: v.url.startsWith('/') ? ('percorso' as const) : ('esterno' as const),
            url: v.url,
          })),
        })
        break
      // `file` + `url` finché l'immagine non è importata: ritocca() li porta nel campo giusto
      case 'immagine':
        out.push({
          blockType: 'immagine',
          file: null,
          url: b.url,
          didascalia: b.didascalia ?? null,
          larghezza: 'testo',
        } as never)
        break
      case 'galleria':
        out.push({
          blockType: 'galleria',
          immagini: b.immagini.map((i) => ({
            file: null,
            url: i.url,
            didascalia: i.didascalia ?? null,
          })),
        } as never)
        break
      case 'planimetria':
        out.push({ blockType: 'planimetria', titolo: null })
        break
      case 'contatti':
        out.push({ blockType: 'contatti', titolo: b.titolo ?? null, voci: b.voci })
        break
      case 'documento':
        // `url` resta finché il file non è importato: la riscrittura lo trasforma in `file`
        out.push({
          blockType: 'documento',
          nome: tronca(b.nome, 200),
          descrizione: b.descrizione ?? null,
          anteprima: b.anteprima ?? true,
          file: null,
          url: b.url,
        } as never)
        break
    }
  }
  return out
}
