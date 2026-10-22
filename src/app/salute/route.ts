/** Controllo di salute per l'hosting: risponde senza toccare il database. */
export const dynamic = 'force-dynamic'

export function GET() {
  return Response.json({ ok: true })
}
