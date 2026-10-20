import styles from './SkipLink.module.css'

export function SkipLink({ targetId = 'contenuto' }: { targetId?: string }) {
  return (
    <a className={styles.skip} href={`#${targetId}`}>
      Vai al contenuto principale
    </a>
  )
}
