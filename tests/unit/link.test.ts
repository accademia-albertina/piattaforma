import { describe, expect, it } from 'vitest'

import { risolviLink, risolviLinks } from '@/lib/link'

describe('risolviLink', () => {
  it('pagina pubblicata → percorso completo', () => {
    expect(
      risolviLink({
        etichetta: 'Ammissioni',
        tipo: 'interno',
        pagina: { percorso: 'didattica/ammissioni' } as never,
      }),
    ).toEqual({ label: 'Ammissioni', href: '/didattica/ammissioni' })
  })

  it('pagina non pubblicata (solo id) → scartata', () => {
    expect(risolviLink({ etichetta: 'Bozza', tipo: 'interno', pagina: 12 })).toBeNull()
  })

  it('indirizzo del sito ed esterno', () => {
    expect(
      risolviLinks([
        { etichetta: 'Avvisi', tipo: 'percorso', url: '/avvisi' },
        { etichetta: 'MUR', tipo: 'esterno', url: 'https://www.mur.gov.it/it' },
      ]),
    ).toEqual([
      { label: 'Avvisi', href: '/avvisi' },
      { label: 'MUR', href: 'https://www.mur.gov.it/it', esterno: true },
    ])
  })
})
