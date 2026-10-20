import { Alert } from '@/components'

export default function HomePage() {
  return (
    <div className="container" style={{ paddingBlock: 'var(--section-pad)' }}>
      <h1>Accademia Albertina di Belle Arti di Torino</h1>
      <p>Questa è la base della nuova piattaforma del sito istituzionale.</p>
      <Alert tone="info" title="Sito in costruzione">
        <p>
          Il sito ufficiale resta <a href="https://albertina-academy.it">albertina-academy.it</a> fino
          al passaggio alla nuova piattaforma.
        </p>
      </Alert>
    </div>
  )
}
