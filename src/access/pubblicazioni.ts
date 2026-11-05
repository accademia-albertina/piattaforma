import type { Access } from 'payload'

import { hasRole } from '@/access/roles'

/** Il catalogo Albertina Press lo curano redazione e vicedirezione (oltre agli admin). */
export const curaCatalogo: Access = ({ req }) =>
  hasRole(req.user, 'admin', 'vicedirezione', 'redazione')

/** Eliminare una pubblicazione dal catalogo spetta solo agli admin. */
export const eliminaPubblicazione: Access = ({ req }) => hasRole(req.user, 'admin')
