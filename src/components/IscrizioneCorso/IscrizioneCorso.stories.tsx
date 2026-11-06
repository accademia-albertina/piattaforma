import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import { IscrizioneCorso } from './IscrizioneCorso'

const meta = {
  title: 'Componenti/IscrizioneCorso',
  component: IscrizioneCorso,
  args: {
    corsoId: 1,
    stato: 'aperta',
    apertura: '1 ottobre 2026, 09:00',
    chiusura: '31 ottobre 2026, 23:59',
    utente: 'studente',
  },
  decorators: [(Story) => <div style={{ maxWidth: '22rem' }}>{Story()}</div>],
} satisfies Meta<typeof IscrizioneCorso>

export default meta
type Story = StoryObj<typeof meta>

export const Aperta: Story = {}
export const Iscritto: Story = { args: { iscrizioneId: 10 } }
export const NonAutenticato: Story = { args: { utente: 'anonimo' } }
export const AltroLivello: Story = { args: { livelloAmmesso: false } }
export const NonAncoraAperta: Story = { args: { stato: 'prima' } }
export const Chiusa: Story = { args: { stato: 'chiusa', iscrizioneId: 10 } }
export const Compatto: Story = { args: { compatto: true, iscrizioneId: 10 } }
