import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { useState } from 'react'

import { MostraPassword } from './MostraPassword'

/** Campo password come quello di Payload, con l'occhio aggiunto da GestionePassword. */
function CampoConOcchio() {
  const [input, setInput] = useState<HTMLInputElement | null>(null)
  return (
    <div className="field-type password">
      <label htmlFor="field-password">Nuova password</label>
      <div className="field-type__wrap">
        <input id="field-password" type="password" defaultValue="Prova-1234!" ref={setInput} />
        {input ? <MostraPassword input={input} /> : null}
      </div>
    </div>
  )
}

const meta = {
  title: 'Pannello/MostraPassword',
  component: CampoConOcchio,
} satisfies Meta<typeof CampoConOcchio>

export default meta
type Story = StoryObj<typeof meta>

export const Campo: Story = {}
