import Link from 'next/link'

import { ssoAttivo } from '@/auth/google'

/** Messaggi per gli errori dell'accesso con Google (?errore=… sulla pagina di accesso). */
export const ERRORI_ACCESSO: Record<string, string> = {
  dominio: 'Usa il tuo account dell’Accademia, quello che finisce con @albertina.academy.',
  email:
    'Google non ha ancora verificato questo indirizzo: accedi prima alla casella su Gmail e riprova.',
  annullato: 'Accesso annullato. Puoi riprovare quando vuoi.',
  scaduto: 'La richiesta è scaduta. Riprova.',
  token: 'Google non ha confermato l’accesso. Riprova tra qualche istante.',
  'non-attivo': 'L’accesso con Google non è ancora attivo.',
}

type Props = { searchParams?: Record<string, string | string[] | undefined> }

/** Testo sopra il modulo di accesso al pannello, con il pulsante di Google quando è configurato. */
export default function PrimaDelLogin({ searchParams }: Props) {
  const codice = searchParams?.errore
  const errore =
    typeof codice === 'string' && Object.hasOwn(ERRORI_ACCESSO, codice)
      ? ERRORI_ACCESSO[codice]
      : undefined
  const google = ssoAttivo()
  // Dove tornare dopo Google (?redirect=…, lo stesso parametro del modulo con la password);
  // l'endpoint lo ripulisce con destinazioneSicura
  const torna = typeof searchParams?.redirect === 'string' ? searchParams.redirect : undefined
  const hrefGoogle = torna
    ? `/api/users/google?dopo=${encodeURIComponent(torna)}`
    : '/api/users/google'
  // Con Google attivo il modulo con la password è nascosto: resta solo per gli admin, in emergenza
  const conPassword = !google || searchParams?.password === '1'
  return (
    <div className={`prima-del-login${conPassword ? '' : ' prima-del-login--solo-google'}`}>
      <p className="prima-del-login__occhiello">Area riservata</p>
      <h1 className="prima-del-login__titolo">Accedi</h1>
      <p className="prima-del-login__testo">
        {google
          ? 'Con il tuo account Google dell’Accademia (@albertina.academy).'
          : 'Per il personale dell’Accademia che gestisce i contenuti del sito.'}
      </p>
      {errore ? (
        <p className="prima-del-login__errore" role="alert">
          {errore}
        </p>
      ) : null}
      {google ? (
        <>
          <a className="prima-del-login__google" href={hrefGoogle}>
            <svg viewBox="0 0 48 48" width="20" height="20" aria-hidden="true" focusable="false">
              <path
                fill="#EA4335"
                d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.8 2.4 30.3 0 24 0 14.6 0 6.6 5.4 2.7 13.3l7.9 6.1C12.5 13.6 17.8 9.5 24 9.5z"
              />
              <path
                fill="#4285F4"
                d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.6 2.9-2.2 5.4-4.7 7.1l7.6 5.9c4.4-4.1 6.9-10.1 6.9-17.5z"
              />
              <path
                fill="#FBBC05"
                d="M10.6 28.6c-.5-1.4-.8-3-.8-4.6s.3-3.2.8-4.6l-7.9-6.1C1 16.6 0 20.2 0 24s1 7.4 2.7 10.7l7.9-6.1z"
              />
              <path
                fill="#34A853"
                d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.6-5.9c-2.1 1.4-4.9 2.3-8.3 2.3-6.2 0-11.5-4.1-13.4-9.8l-7.9 6.1C6.6 42.6 14.6 48 24 48z"
              />
            </svg>
            Accedi con Google
          </a>
          {conPassword ? (
            <p className="prima-del-login__oppure">
              Accesso di emergenza con email e password, solo per gli amministratori.
            </p>
          ) : (
            <Link
              className="prima-del-login__emergenza"
              href={`/admin/login?password=1${torna ? `&redirect=${encodeURIComponent(torna)}` : ''}`}
            >
              Accesso di emergenza (solo amministratori)
            </Link>
          )}
        </>
      ) : null}
    </div>
  )
}
