import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import ApriSito from '@/components/admin/ApriSito'
import Avatar from '@/components/admin/Avatar'
import { toccoFuoriDalMenu } from '@/components/admin/ChiudiMenuFuori'
import RicercaInMinuscolo, { segnapostoNaturale } from '@/components/admin/RicercaInMinuscolo'

import { axeViolations } from './axe'

describe('Intestazione del pannello: Sito e Account', () => {
  it('«Sito» ha icona, etichetta e un nome che dice della nuova scheda', async () => {
    const { container } = render(<ApriSito />)
    const link = screen.getByRole('link', { name: 'Sito (si apre in una nuova scheda)' })
    expect(link.getAttribute('target')).toBe('_blank')
    expect(link.textContent).toBe('Sito')
    expect(await axeViolations(container)).toEqual([])
  })

  it('«Account» dentro il collegamento di Payload è accessibile', async () => {
    const { container } = render(
      <a href="#account" aria-label="Account" className="app-header__account">
        <Avatar />
      </a>,
    )
    expect(screen.getByRole('link', { name: 'Account' }).textContent).toBe('Account')
    expect(await axeViolations(container)).toEqual([])
  })
})

describe('Segnaposto della ricerca negli elenchi', () => {
  it('scrive le etichette in minuscolo e «o» al posto di «Oppure»', () => {
    expect(segnapostoNaturale('Cerca per Chi, Email Oppure Elemento')).toBe(
      'Cerca per chi, email o elemento',
    )
    expect(segnapostoNaturale('Cerca per Titolo')).toBe('Cerca per titolo')
    expect(segnapostoNaturale('Cerca per Nome Oppure Cognome')).toBe('Cerca per nome o cognome')
  })

  it('lascia le sigle e i testi diversi come sono', () => {
    expect(segnapostoNaturale('Cerca per ID')).toBe('Cerca per ID')
    expect(segnapostoNaturale('Cerca per Titolo Oppure CIG')).toBe('Cerca per titolo o CIG')
    expect(segnapostoNaturale('Filtra')).toBe('Filtra')
  })

  it('corregge il campo di ricerca appena compare', async () => {
    render(
      <RicercaInMinuscolo>
        <input
          id="search-filter-input"
          aria-label="Cerca"
          placeholder="Cerca per Chi Oppure Email"
        />
      </RicercaInMinuscolo>,
    )
    expect(screen.getByRole('textbox').getAttribute('placeholder')).toBe('Cerca per chi o email')
  })
})

describe('Menu del pannello su telefono', () => {
  it('un tocco fuori dal cassetto aperto lo chiude, dentro no', () => {
    document.body.innerHTML = `
      <div class="app-header__mobile-nav-toggler"><button id="apri">Menu</button></div>
      <aside class="nav nav--nav-open"><a id="voce" href="#avvisi">Avvisi</a></aside>
      <main><p id="velo">Pagina</p></main>`
    expect(toccoFuoriDalMenu(document.getElementById('velo'))).toBe(true)
    expect(toccoFuoriDalMenu(document.getElementById('voce'))).toBe(false)
    expect(toccoFuoriDalMenu(document.getElementById('apri'))).toBe(false)
    document.querySelector('.nav')!.classList.remove('nav--nav-open')
    expect(toccoFuoriDalMenu(document.getElementById('velo'))).toBe(false)
    document.body.innerHTML = ''
  })
})
