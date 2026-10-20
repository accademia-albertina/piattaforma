import type { ReactNode } from 'react'

import styles from './Alert.module.css'

export type AlertTone = 'info' | 'success' | 'warning' | 'error'

const TONE_LABEL: Record<AlertTone, string> = {
  info: 'Informazione',
  success: 'Operazione riuscita',
  warning: 'Attenzione',
  error: 'Errore',
}

export type AlertProps = {
  tone?: AlertTone
  title?: string
  children: ReactNode
  /** Annuncia subito il messaggio agli screen reader: usalo solo per messaggi comparsi dopo un'azione. */
  live?: boolean
}

export function Alert({ tone = 'info', title, children, live = false }: AlertProps) {
  const role = live ? (tone === 'error' ? 'alert' : 'status') : undefined
  return (
    <div className={`${styles.alert} ${styles[tone]}`} role={role}>
      <p className={styles.title}>
        <span className="visually-hidden">{TONE_LABEL[tone]}: </span>
        {title ?? TONE_LABEL[tone]}
      </p>
      <div className={styles.body}>{children}</div>
    </div>
  )
}
