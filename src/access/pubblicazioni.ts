import type { Access } from 'payload'

import { hasRole } from '@/access/roles'

/** Il catalogo Albertina Press lo cura la biblioteca, con la redazione (oltre agli admin). */
export const curaCatalogo: Access = ({ req }) =>
  hasRole(req.user, 'admin', 'redazione', 'biblioteca')

/** Eliminare una pubblicazione dal catalogo spetta solo agli admin. */
export const eliminaPubblicazione: Access = ({ req }) => hasRole(req.user, 'admin')
