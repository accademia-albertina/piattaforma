import { numeroCiclo } from '@/utilities/ciclo'

import { payloadClient } from './payload'

/** Dottorandi in corso, raggruppati per ciclo dal più recente (senza ciclo in fondo). */
export async function trovaDottorandi() {
  const payload = await payloadClient()
  const res = await payload.find({
    collection: 'dottorandi',
    where: { attivo: { equals: true } },
    sort: 'cognome',
    pagination: false,
    overrideAccess: false,
    depth: 1,
    select: {
      nome: true,
      cognome: true,
      nomeCompleto: true,
      slug: true,
      ciclo: true,
      curriculum: true,
      titoloProgetto: true,
      foto: true,
    },
  })
  const gruppi = new Map<string, typeof res.docs>()
  for (const d of res.docs) {
    const chiave = d.ciclo ?? ''
    gruppi.set(chiave, [...(gruppi.get(chiave) ?? []), d])
  }
  return [...gruppi.entries()]
    .sort(([a], [b]) => numeroCiclo(b) - numeroCiclo(a))
    .map(([ciclo, voci]) => ({ ciclo: ciclo || null, voci }))
}

export async function trovaDottorando(slug: string) {
  const payload = await payloadClient()
  const res = await payload.find({
    collection: 'dottorandi',
    where: { slug: { equals: slug } },
    limit: 1,
    overrideAccess: false,
    depth: 1,
  })
  return res.docs[0] ?? null
}
