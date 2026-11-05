/* eslint-disable @next/next/no-img-element -- grafiche del pannello Payload, SVG statici */

import Link from 'next/link'

/**
 * Logo nella pagina di accesso del pannello: misurato, non deve dominare il modulo.
 * Sopra c'è "Torna al sito" e il logo stesso porta alla home: la pagina non è un vicolo cieco.
 */
export default function Logo() {
  return (
    <div className="accesso-testata">
      <Link className="accesso-testata__torna" href="/">
        <span aria-hidden="true">←</span> Torna al sito
      </Link>
      <Link
        className="accesso-testata__logo"
        href="/"
        aria-label="Accademia Albertina: vai al sito"
      >
        <img
          className="logo-accesso"
          src="/brand/logo-albertina.svg"
          alt=""
          width={176}
          height={81}
        />
      </Link>
    </div>
  )
}
