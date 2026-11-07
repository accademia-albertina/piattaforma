'use client'

import { SetStepNav } from '@payloadcms/ui'

/**
 * Percorso in alto nelle viste personalizzate del pannello (Guida, Changelog): senza, la casetta
 * è considerata la pagina corrente e non si può cliccare per tornare alla dashboard.
 */
export default function PassoPannello({ etichetta }: { etichetta: string }) {
  return <SetStepNav nav={[{ label: etichetta }]} />
}
