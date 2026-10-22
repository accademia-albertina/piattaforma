import { timingSafeEqual } from 'node:crypto'
import { NextResponse, type NextRequest } from 'next/server'

/**
 * Anteprima online: se ANTEPRIMA_PASSWORD è impostata, tutto il sito (pannello compreso)
 * chiede utente e password del browser e non viene indicizzato. In produzione la variabile non c'è.
 */
const UTENTE = process.env.ANTEPRIMA_UTENTE || 'albertina'
const PASSWORD = process.env.ANTEPRIMA_PASSWORD

function uguali(a: string, b: string) {
  const x = Buffer.from(a)
  const y = Buffer.from(b)
  return x.length === y.length && timingSafeEqual(x, y)
}

function autorizzato(req: NextRequest) {
  const [tipo, valore] = (req.headers.get('authorization') ?? '').split(' ')
  if (tipo !== 'Basic' || !valore) return false
  const testo = Buffer.from(valore, 'base64').toString('utf8')
  const i = testo.indexOf(':')
  return i > 0 && uguali(testo.slice(0, i), UTENTE) && uguali(testo.slice(i + 1), PASSWORD!)
}

export function proxy(req: NextRequest) {
  if (!PASSWORD) return NextResponse.next()
  if (!autorizzato(req)) {
    return new NextResponse('Anteprima riservata', {
      status: 401,
      headers: {
        'WWW-Authenticate': 'Basic realm="Anteprima Accademia Albertina", charset="UTF-8"',
        'X-Robots-Tag': 'noindex, nofollow',
      },
    })
  }
  const res = NextResponse.next()
  res.headers.set('X-Robots-Tag', 'noindex, nofollow')
  return res
}

export const config = {
  // Tutto tranne il controllo di salute usato dall'hosting.
  matcher: ['/((?!salute$).*)'],
}
