'use client'

import { useFormFields } from '@payloadcms/ui'
import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

import { MostraPassword, passwordUtile } from './MostraPassword'

const SELETTORE_CAMPI = '#field-password, #field-confirm-password'

type Posto = { input: HTMLInputElement; contenitore: HTMLElement }

/**
 * Campo invisibile nella scheda Utente. Aggiunge l'occhio ai campi «Nuova password» e
 * «Conferma password» (che Payload non permette di personalizzare) e, con l'accesso Google
 * attivo, nasconde «Cambia password» per chi entra solo con Google: lì la password non serve.
 */
export default function GestionePassword({ soloGoogle = false }: { soloGoogle?: boolean }) {
  const ruoli = useFormFields(([campi]) => campi.roles?.value)
  const accountDiProva = useFormFields(([campi]) => campi.accountDiProva?.value)
  const [posti, setPosti] = useState<Posto[]>([])

  useEffect(() => {
    const aggiorna = () => {
      const trovati: Posto[] = []
      document.querySelectorAll<HTMLInputElement>(SELETTORE_CAMPI).forEach((input) => {
        const wrap = input.closest('.field-type__wrap')
        if (!wrap) return
        let contenitore = wrap.querySelector<HTMLElement>(':scope > .mostra-password-posto')
        if (!contenitore) {
          contenitore = document.createElement('span')
          contenitore.className = 'mostra-password-posto'
          wrap.appendChild(contenitore)
        }
        trovati.push({ input, contenitore })
      })
      setPosti((prima) =>
        prima.length === trovati.length &&
        prima.every(
          (p, i) => p.input === trovati[i].input && p.contenitore === trovati[i].contenitore,
        )
          ? prima
          : trovati,
      )
    }
    aggiorna()
    // I campi compaiono solo dopo «Cambia password»
    const osservatore = new MutationObserver(aggiorna)
    osservatore.observe(document.body, { childList: true, subtree: true })
    return () => osservatore.disconnect()
  }, [])

  return (
    <>
      {passwordUtile(soloGoogle, ruoli, accountDiProva) ? null : (
        <style>{'#change-password { display: none; }'}</style>
      )}
      {posti.map(({ input, contenitore }) =>
        createPortal(<MostraPassword input={input} />, contenitore, input.id),
      )}
    </>
  )
}
