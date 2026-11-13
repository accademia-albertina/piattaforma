import { cleanup, render } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import { isPdf, marcaLinkPdf } from '@/components/LinkPdf/LinkPdf'

afterEach(cleanup)

describe('link ai PDF', () => {
  it('riconosce i PDF, anche con query e maiuscole', () => {
    expect(isPdf('/api/media/file/orario.pdf')).toBe(true)
    expect(isPdf('https://esempio.it/Bando.PDF?v=2')).toBe(true)
    expect(isPdf('/avvisi/bando-pdf')).toBe(false)
    expect(isPdf(null)).toBe(false)
  })

  it('apre i PDF in una nuova scheda, ma non i download né gli altri link', () => {
    const { container } = render(
      <div>
        <a href="/api/media/file/orario.pdf">Orario</a>
        <a href="/api/media/file/modulo.pdf" download>
          Modulo
        </a>
        <a href="https://example.org/avvisi">Avvisi</a>
      </div>,
    )
    marcaLinkPdf(container)
    const [orario, modulo, avvisi] = Array.from(container.querySelectorAll('a'))
    expect(orario.target).toBe('_blank')
    expect(orario.rel).toBe('noopener')
    expect(orario.getAttribute('aria-describedby')).toBe('avviso-nuova-scheda')
    expect(modulo.target).toBe('')
    expect(avvisi.target).toBe('')
  })
})
