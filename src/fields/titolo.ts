import type { TextFieldSingleValidation } from 'payload'
import { text } from 'payload/shared'

import { validaMaiuscole } from '@/utilities/maiuscole'

/**
 * Validazione dei titoli di tutte le collezioni: quella standard di Payload (obbligatorio,
 * lunghezza) più il divieto dei titoli tutti in maiuscolo.
 */
export const validaTitolo: TextFieldSingleValidation = (value, args) => {
  const maiuscole = validaMaiuscole(value)
  return maiuscole === true ? text(value, args) : maiuscole
}
