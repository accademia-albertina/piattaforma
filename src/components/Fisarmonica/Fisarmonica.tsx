'use client'

import type { ReactNode } from 'react'
import {
  Button,
  Disclosure,
  DisclosureGroup,
  DisclosurePanel,
  Heading,
} from 'react-aria-components'

import styles from './Fisarmonica.module.css'

export type VoceFisarmonica = { id: string; titolo: string; contenuto: ReactNode }

/** Voci che si aprono e chiudono (pattern WAI-ARIA Accordion). Più voci possono restare aperte. */
export function Fisarmonica({
  voci,
  livello = 3,
}: {
  voci: VoceFisarmonica[]
  livello?: 2 | 3 | 4
}) {
  return (
    <DisclosureGroup allowsMultipleExpanded className={styles.group}>
      {voci.map((v) => (
        <Disclosure key={v.id} id={v.id} className={styles.item}>
          <Heading level={livello} className={styles.heading}>
            <Button slot="trigger" className={styles.trigger}>
              <span>{v.titolo}</span>
              <svg
                className={styles.icon}
                viewBox="0 0 24 24"
                width="20"
                height="20"
                aria-hidden="true"
                focusable="false"
              >
                <path d="M6 9l6 6 6-6" fill="none" stroke="currentColor" strokeWidth="2" />
              </svg>
            </Button>
          </Heading>
          <DisclosurePanel className={styles.panel}>
            <div className={styles.body}>{v.contenuto}</div>
          </DisclosurePanel>
        </Disclosure>
      ))}
    </DisclosureGroup>
  )
}
