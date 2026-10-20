import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="container" style={{ paddingBlock: 'var(--section-pad)' }}>
      <h1>Pagina non trovata</h1>
      <p>
        La pagina che cerchi non esiste o è stata spostata. Torna alla <Link href="/">pagina iniziale</Link>.
      </p>
    </div>
  )
}
