/* eslint-disable @next/next/no-img-element -- grafiche del pannello Payload, SVG statici */

/** Logo nella pagina di accesso del pannello: misurato, non deve dominare il modulo. */
export default function Logo() {
  return (
    <img
      className="logo-accesso"
      src="/brand/logo-albertina.svg"
      alt="Accademia Albertina di Belle Arti di Torino"
      width={176}
      height={81}
    />
  )
}
