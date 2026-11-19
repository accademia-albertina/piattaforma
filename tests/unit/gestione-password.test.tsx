import { fireEvent, render, screen } from '@testing-library/react'
import { useState } from 'react'
import { describe, expect, it } from 'vitest'

import { MostraPassword, passwordUtile } from '@/components/admin/MostraPassword'

import { axeViolations } from './axe'

function Campo() {
  const [input, setInput] = useState<HTMLInputElement | null>(null)
  return (
    <div>
      <label htmlFor="field-password">Nuova password</label>
      <input id="field-password" type="password" ref={setInput} />
      {input ? <MostraPassword input={input} /> : null}
    </div>
  )
}

describe('Password nella scheda Utente', () => {
  it('l’occhio mostra e nasconde la password ed è accessibile', async () => {
    const { container } = render(<Campo />)
    const campo = screen.getByLabelText('Nuova password') as HTMLInputElement
    const occhio = screen.getByRole('button', { name: 'Mostra la password' })
    expect(occhio.getAttribute('aria-pressed')).toBe('false')
    fireEvent.click(occhio)
    expect(campo.type).toBe('text')
    expect(screen.getByRole('button', { name: 'Nascondi la password' })).toBeTruthy()
    fireEvent.click(occhio)
    expect(campo.type).toBe('password')
    expect(await axeViolations(container)).toEqual([])
  })

  it('con Google attivo la password serve solo ad admin e account di prova', () => {
    expect(passwordUtile(false, ['studente'], false)).toBe(true)
    expect(passwordUtile(true, ['studente'], false)).toBe(false)
    expect(passwordUtile(true, ['docente', 'admin'], false)).toBe(true)
    expect(passwordUtile(true, ['studente'], true)).toBe(true)
  })
})
