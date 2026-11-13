/**
 * Contenuto della pagina /admin/drive (stato del collegamento a Google Drive e pulsanti).
 * Solo presentazione: i dati li legge la vista Drive.tsx. Pulsanti come semplici link e moduli
 * (POST verso /api/drive/...): funzionano anche senza JavaScript.
 */
import styles from './Drive.module.css'

export type PropsPannelloDrive = {
  account: string
  configurato: boolean
  mancanti: string[]
  collegato: boolean
  email?: string | null
  collegatoIl?: string | null
  collegatoDa?: string | null
  erroreCollegamento?: string | null
  idCartella: string
  cartella: { nome?: string; condiviso?: boolean; errore?: string }
  suDisco: number
  spostamento: {
    inCorso: boolean
    totale: number
    spostati: number
    mancanti: string[]
    errori: string[]
    finitoIl?: string
  }
  esito?: string
  errore?: string
}

const ESITI: Record<string, string> = {
  collegato:
    'Google Drive collegato. Da ora i file caricati nel pannello vanno nella cartella Drive.',
  scollegato: 'Google Drive scollegato. I nuovi file restano sul server finché non lo ricolleghi.',
  sposta: 'Spostamento avviato: ricarica la pagina per vedere a che punto è.',
}

const erroriPer = (account: string): Record<string, string> => ({
  account: `Hai scelto un account diverso da ${account}. Riprova e, nella schermata di Google, scegli quello.`,
  permessi:
    'Nella schermata di Google manca la spunta su Google Drive. Riprova lasciandola attiva.',
  annullato: 'Collegamento annullato nella schermata di Google.',
  scaduto:
    'La richiesta è scaduta (più di 10 minuti) o è stata aperta da un altro browser. Riprova.',
  cartella: `La cartella Drive indicata in DRIVE_ID non esiste o ${account} non può modificarla.`,
  token:
    'Google non ha confermato il collegamento. Riprova; se si ripete, controlla il client OAuth.',
  google: 'Google non risponde come previsto. Riprova tra qualche minuto.',
  configurazione: 'Mancano le impostazioni di Drive sul server (vedi sotto).',
  'non-collegato': 'Prima collega Google Drive.',
})

const data = new Intl.DateTimeFormat('it-IT', {
  dateStyle: 'long',
  timeStyle: 'short',
  timeZone: 'Europe/Rome',
})

export default function PannelloDrive(p: PropsPannelloDrive) {
  const { account, configurato, mancanti, collegato, cartella, suDisco, idCartella } = p
  const sposta = p.spostamento
  const esito = p.esito ? ESITI[p.esito] : undefined
  const errore = p.errore ? erroriPer(account)[p.errore] : undefined
  const funziona = collegato && !cartella.errore && !p.erroreCollegamento
  const stato = {
    email: p.email,
    collegatoIl: p.collegatoIl,
    collegatoDa: p.collegatoDa,
    errore: p.erroreCollegamento,
  }

  return (
    <div className={styles.drive}>
      <header className={styles.intestazione}>
        <h1>Google Drive</h1>
        <p>
          Le immagini e i PDF caricati nel pannello si salvano nella cartella Drive dell’Accademia,
          con l’account <strong>{account}</strong>. Il sito li mostra dalla sua copia veloce, senza
          link pubblici a Drive.
        </p>
      </header>

      {esito && (
        <p role="status" className={`${styles.avviso} ${styles.ok}`}>
          {esito}
        </p>
      )}
      {errore && (
        <p role="alert" className={`${styles.avviso} ${styles.ko}`}>
          {errore}
        </p>
      )}

      <section aria-labelledby="stato" className={styles.scheda}>
        <h2 id="stato">Stato</h2>
        <dl className={styles.dati}>
          <dt>Collegamento</dt>
          <dd>
            <span
              className={`${styles.pallino} ${funziona ? styles.verde : styles.grigio}`}
              aria-hidden
            />
            {!configurato
              ? 'Non configurato sul server'
              : !collegato
                ? 'Non collegato'
                : funziona
                  ? 'Attivo'
                  : 'Da ricollegare'}
          </dd>
          {collegato && (
            <>
              <dt>Account</dt>
              <dd>{stato.email}</dd>
              <dt>Collegato</dt>
              <dd>
                {stato.collegatoIl ? data.format(new Date(stato.collegatoIl)) : '—'}
                {stato.collegatoDa ? ` da ${stato.collegatoDa}` : ''}
              </dd>
            </>
          )}
          {configurato && (
            <>
              <dt>Cartella</dt>
              <dd>
                <a
                  href={`https://drive.google.com/drive/folders/${idCartella}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  {cartella.nome ?? 'Apri in Drive'}
                  <span className={styles.nascosto}> (si apre in una nuova scheda)</span>
                </a>
                {cartella.nome && (
                  <span className={styles.nota}>
                    {cartella.condiviso ? ' · Drive condiviso' : ' · Il mio Drive'} · sottocartella
                    “media”
                  </span>
                )}
              </dd>
            </>
          )}
        </dl>

        {(stato.errore || cartella.errore) && (
          <p role="alert" className={`${styles.avviso} ${styles.ko}`}>
            {stato.errore ?? 'La cartella non risponde con il collegamento salvato.'} Ricollega
            Drive con il pulsante qui sotto.
          </p>
        )}

        {!configurato ? (
          <p className={styles.nota}>
            Su Render, in <em>Environment</em>, mancano: {mancanti.join(', ')}.
          </p>
        ) : (
          <div className={styles.azioni}>
            {/* Navigazione completa (non Link): l'endpoint rimanda a Google */}
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
            <a className={styles.primario} href="/api/drive/oauth/avvia">
              {collegato ? 'Ricollega Google Drive' : 'Collega Google Drive'}
            </a>
            {collegato && (
              <form method="post" action="/api/drive/scollega">
                <button type="submit" className={styles.secondario}>
                  Scollega
                </button>
              </form>
            )}
          </div>
        )}
        {configurato && !collegato && (
          <ol className={styles.passi}>
            <li>Premi “Collega Google Drive”.</li>
            <li>
              Nella schermata di Google scegli <strong>{account}</strong> (entra con la sua password
              se serve).
            </li>
            <li>Lascia la spunta su Google Drive e premi “Continua”: torni qui.</li>
          </ol>
        )}
      </section>

      <section aria-labelledby="sul-server" className={styles.scheda}>
        <h2 id="sul-server">File ancora sul server</h2>
        {sposta.inCorso ? (
          <p role="status">
            Spostamento in corso: {sposta.spostati} di {sposta.totale}. Ricarica la pagina per
            aggiornare.
          </p>
        ) : (
          <p>
            {suDisco === 0
              ? collegato
                ? 'Nessuno: tutti i file sono su Drive.'
                : 'Nessun file sul disco del server.'
              : `${suDisco} ${suDisco === 1 ? 'file caricato' : 'file caricati'} prima del collegamento ${suDisco === 1 ? 'è' : 'sono'} ancora sul disco del server.`}
          </p>
        )}
        {sposta.finitoIl && !sposta.inCorso && (
          <p className={styles.nota}>
            Ultimo spostamento: {sposta.spostati} spostati
            {sposta.mancanti.length > 0 && `, ${sposta.mancanti.length} non trovati sul disco`}
            {sposta.errori.length > 0 && `, ${sposta.errori.length} non riusciti (riprova)`}.
          </p>
        )}
        {funziona && suDisco > 0 && !sposta.inCorso && (
          <form method="post" action="/api/drive/sposta" className={styles.azioni}>
            <button type="submit" className={styles.primario}>
              Sposta su Drive
            </button>
          </form>
        )}
      </section>
    </div>
  )
}
