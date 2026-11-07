'use client'

import type { ReactNode } from 'react'
import { Tab, TabList, TabPanel, Tabs } from 'react-aria-components'

import styles from './SchedePercorso.module.css'

export type Percorso = { id: string; label: string; contenuto: ReactNode }

/**
 * Schede (pattern WAI-ARIA Tabs): i percorsi di una scuola (Triennio e Biennio) o i filtri
 * degli avvisi in homepage.
 * Con un solo percorso non servono schede: si mostra direttamente il contenuto.
 */
export function SchedePercorso({ percorsi, label }: { percorsi: Percorso[]; label: string }) {
  if (percorsi.length === 0) return null
  if (percorsi.length === 1) return <div className={styles.pannello}>{percorsi[0].contenuto}</div>
  return (
    <Tabs className={styles.schede}>
      <TabList aria-label={label} className={styles.lista}>
        {percorsi.map((p) => (
          <Tab key={p.id} id={p.id} className={styles.scheda}>
            {p.label}
          </Tab>
        ))}
      </TabList>
      {percorsi.map((p) => (
        <TabPanel key={p.id} id={p.id} className={styles.pannello}>
          {p.contenuto}
        </TabPanel>
      ))}
    </Tabs>
  )
}
