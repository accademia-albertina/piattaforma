/**
 * Indirizzo di un file del pannello da dare a next/image: sempre relativo (/api/media/file/…).
 * Con NEXT_PUBLIC_SERVER_URL Payload rende gli url assoluti, ma l’ottimizzatore di Next accetta
 * solo i percorsi locali (localPatterns): con l’url assoluto risponde 400 e la foto non si vede.
 */
export function srcImmagine(url: string): string {
  const m = /^https?:\/\/[^/]+(\/api\/media\/file\/.*)$/.exec(url)
  return m ? m[1] : url
}
