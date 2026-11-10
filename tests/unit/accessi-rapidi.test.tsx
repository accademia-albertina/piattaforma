import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import { AccessiRapidi } from '@/components'
import { ACCESSI_HOME } from '@/lib/accessi-home'

import { axeViolations } from './axe'

afterEach(cleanup)

describe('Homepage: accessi rapidi sotto lo slider', () => {
  it('ha un titolo e quattro collegamenti con nome e descrizione, senza violazioni axe', async () => {
    const { container } = render(<AccessiRapidi voci={ACCESSI_HOME} />)
    expect(screen.getByRole('heading', { level: 2, name: 'Da dove vuoi iniziare?' })).toBeTruthy()
    const link = screen.getAllByRole('link')
    expect(link).toHaveLength(4)
    expect(screen.getByRole('link', { name: /^Ammissioni/ }).getAttribute('href')).toBe(
      '/didattica/ammissioni',
    )
    expect(screen.getByRole('link', { name: /^Orari e calendari/ }).getAttribute('href')).toBe(
      '/calendari',
    )
    expect(await axeViolations(container)).toEqual([])
  })
})
