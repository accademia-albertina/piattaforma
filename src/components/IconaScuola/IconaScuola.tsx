import { ICONE_SCUOLE } from '@/assets/icone-scuole'

type Props = {
  /** Slug della scuola, es. "pittura". */
  scuola: string
  size?: number
  className?: string
}

/** Icona ufficiale della scuola, nel colore del testo. Decorativa: il nome della scuola sta accanto. */
export function IconaScuola({ scuola, size = 40, className }: Props) {
  const icona = ICONE_SCUOLE[scuola]
  if (!icona) return null
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox={icona.viewBox}
      fill="none"
      aria-hidden="true"
      focusable="false"
      // Markup statico dagli SVG ufficiali, ripulito in src/assets/icone-scuole.ts
      dangerouslySetInnerHTML={{ __html: icona.svg }}
    />
  )
}
