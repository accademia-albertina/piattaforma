import { describe, expect, it } from 'vitest'

import { dividiLink, senzaLink } from '@/utilities/autolink'
import { tronca } from '@/utilities/lexicalText'

describe('dividiLink', () => {
  it('rende link gli indirizzi web, lasciando fuori la punteggiatura finale', () => {
    expect(dividiLink('Modulo: https://forms.gle/XSzY5Gersd. Grazie')).toEqual([
      { tipo: 'testo', testo: 'Modulo: ' },
      { tipo: 'link', testo: 'https://forms.gle/XSzY5Gersd', href: 'https://forms.gle/XSzY5Gersd' },
      { tipo: 'testo', testo: '. Grazie' },
    ])
  })

  it('www. diventa https:// e le email diventano mailto:', () => {
    expect(dividiLink('www.mur.gov.it o didattica@albertina.academy')).toEqual([
      { tipo: 'link', testo: 'www.mur.gov.it', href: 'https://www.mur.gov.it' },
      { tipo: 'testo', testo: ' o ' },
      {
        tipo: 'link',
        testo: 'didattica@albertina.academy',
        href: 'mailto:didattica@albertina.academy',
      },
    ])
  })

  it('testo senza indirizzi resta un pezzo solo', () => {
    expect(dividiLink('Classroom: dpdk4cgs')).toEqual([{ tipo: 'testo', testo: 'Classroom: dpdk4cgs' }])
  })
})

describe('senzaLink', () => {
  it('toglie gli indirizzi dalle anteprime', () => {
    expect(senzaLink('Google form da compilare entro il 7 novembre: https://forms.gle/abc')).toBe(
      'Google form da compilare entro il 7 novembre',
    )
    expect(senzaLink('Google form: https://forms.gle/abc Classroom: 4q2axtno')).toBe(
      'Google form: Classroom: 4q2axtno',
    )
  })
})

describe('tronca', () => {
  it('taglia all’ultima parola intera', () => {
    expect(tronca('uno due tre quattro', 9)).toBe('uno due…')
    expect(tronca('breve', 20)).toBe('breve')
  })
})
