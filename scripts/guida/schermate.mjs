// Genera le schermate della Guida del pannello (/admin/guida) con i riquadri numerati.
//
// Per ogni scena di scene.mjs entra nel pannello con un account del ruolo giusto, apre la
// pagina, fotografa la finestra in tema chiaro e scuro (public/guida/<id>-chiaro|scuro.webp)
// e salva in src/content/guida-schermate.json la posizione dei riquadri, in percentuale:
// i riquadri sono disegnati dalla Guida sopra l'immagine, con gli stessi numeri dei passi.
//
// Uso (con il sito in locale, database con i contenuti demo):
//   pnpm dev                                   # in un altro terminale
//   node scripts/guida/schermate.mjs           # tutte le scene
//   node scripts/guida/schermate.mjs avvisi    # solo le scene che iniziano con "avvisi"
//
// Variabili: GUIDA_URL (predefinito http://localhost:3000), GUIDA_ADMIN_EMAIL e
// GUIDA_ADMIN_PASSWORD (se il database è vuoto l'admin viene creato con questi valori),
// PW_CHROMIUM_PATH (Chromium già installato). Non lanciarlo contro l'anteprima o la
// produzione: crea account di prova (guida.<ruolo>@albertina.academy).
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { chromium } from '@playwright/test'
import sharp from 'sharp'

import { SCENE } from './scene.mjs'

const BASE = process.env.GUIDA_URL ?? 'http://localhost:3000'
const ADMIN = {
  email: process.env.GUIDA_ADMIN_EMAIL ?? 'admin.guida@albertina.academy',
  password: process.env.GUIDA_ADMIN_PASSWORD ?? 'Guida-2026!',
}
const PASSWORD = 'Guida-prova-2026!'
// Finestra predefinita: abbastanza stretta perché il testo resti leggibile una volta
// rimpicciolito nella Guida (ogni scena può cambiarla con `larghezza`/`altezza`).
const LARGHEZZA = 1120
const ALTEZZA = 720
const SCALA = 2
const TEMI = { chiaro: 'light', scuro: 'dark' }

const radice = new URL('../../', import.meta.url)
const cartellaImmagini = new URL('public/guida/', radice)
const fileDati = new URL('src/content/guida-schermate.json', radice)

/* ---------- REST con l'admin ---------- */

let token
async function api(percorso, { method = 'GET', body } = {}) {
  const res = await fetch(`${BASE}/api${percorso}`, {
    method,
    headers: {
      'content-type': 'application/json',
      ...(token ? { authorization: `JWT ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  const json = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(`${method} ${percorso}: ${res.status} ${JSON.stringify(json)}`)
  return json
}

async function entraComeAdmin() {
  const init = await api('/users/init')
  if (!init.initialized) {
    await api('/users/first-register', {
      method: 'POST',
      body: { ...ADMIN, nome: 'Admin', cognome: 'Guida' },
    })
  }
  token = (await api('/users/login', { method: 'POST', body: ADMIN })).token
}

/** Crea (o riporta) l'account di prova di un ruolo e restituisce l'email. */
async function account(ruolo) {
  if (ruolo === 'admin') return ADMIN.email
  const email =
    ruolo === 'nuovo' ? 'mario.rossi@albertina.academy' : `guida.${ruolo}@albertina.academy`
  const dati = {
    email,
    password: PASSWORD,
    nome: ruolo === 'nuovo' ? 'Mario' : 'Prova',
    cognome: ruolo === 'nuovo' ? 'Rossi' : ruolo,
    roles: ruolo === 'nuovo' ? [] : [ruolo],
  }
  const { docs } = await api(`/users?where[email][equals]=${encodeURIComponent(email)}&depth=0`)
  const utente = docs[0]
    ? (await api(`/users/${docs[0].id}`, { method: 'PATCH', body: dati })).doc
    : (await api('/users', { method: 'POST', body: dati })).doc
  if (ruolo === 'docente') await collegaDocente(utente.id)
  return email
}

/** Il docente di prova diventa il titolare del primo profilo con dei corsi. */
let docenteDiProva
async function collegaDocente(idUtente) {
  if (docenteDiProva) return
  const { docs } = await api('/corsi?where[docenti][exists]=true&limit=1&depth=0&sort=titolo')
  const idDocente = docs[0].docenti[0]
  const { docs: giaCollegati } = await api(`/docenti?where[account][equals]=${idUtente}&depth=0`)
  for (const d of giaCollegati) {
    if (d.id !== idDocente)
      await api(`/docenti/${d.id}`, { method: 'PATCH', body: { account: null } })
  }
  await api(`/docenti/${idDocente}`, { method: 'PATCH', body: { account: idUtente } })
  docenteDiProva = { idDocente, idCorso: docs[0].id }
}

/* ---------- Browser ---------- */

async function apriSessione(browser, ruolo, tema, { larghezza, altezza }) {
  const email = await account(ruolo)
  const context = await browser.newContext({
    viewport: { width: larghezza, height: altezza },
    deviceScaleFactor: SCALA,
    locale: 'it-IT',
    timezoneId: 'Europe/Rome',
  })
  await context.addCookies([{ name: 'payload-theme', value: tema, url: BASE }])
  await context.addInitScript((css) => {
    document.addEventListener('DOMContentLoaded', () => {
      const style = document.createElement('style')
      style.textContent = css
      document.head.append(style)
    })
  }, CSS_FOTO)
  const page = await context.newPage()
  await page.goto(`${BASE}/admin/login`)
  await page.fill('#field-email', email)
  await page.fill('#field-password', email === ADMIN.email ? ADMIN.password : PASSWORD)
  await page.click('button[type="submit"]')
  await page.waitForURL((u) => !u.pathname.endsWith('/login'))
  return { context, page }
}

/** Nasconde ciò che non serve nella foto (indicatore di Next in sviluppo, cursore). */
const CSS_FOTO = `
  nextjs-portal, [data-nextjs-toast] { display: none !important; }
  *, *::before, *::after { caret-color: transparent !important; transition: none !important; animation: none !important; }
`

async function menuAperto(page, aperto) {
  await page.locator('.nav--nav-hydrated').waitFor({ state: 'attached' })
  const template = page.locator('.template-default')
  const ora = await template.evaluate((el) => el.classList.contains('template-default--nav-open'))
  if (ora !== aperto) {
    await page.locator('.app-header__mobile-nav-toggler, #nav-toggler button').first().click()
    await page.waitForTimeout(400)
  }
}

/**
 * Rettangolo (in px della finestra) che contiene tutti gli elementi di un selettore.
 * Un array di selettori dà più rettangoli con lo stesso numero (elementi lontani tra loro).
 */
async function rettangoli(page, sel) {
  if (Array.isArray(sel)) return (await Promise.all(sel.map((s) => rettangoli(page, s)))).flat()
  const loc = typeof sel === 'function' ? sel(page) : page.locator(sel)
  const n = await loc.count()
  if (!n) throw new Error(`nessun elemento per ${sel}`)
  const trovati = []
  for (let i = 0; i < n; i++) {
    const r = await loc.nth(i).evaluate((el) => {
      // Per un campo del modulo prendo tutto il campo (etichetta compresa), non solo l'input.
      const box = (el.id?.startsWith('field-') && el.closest('.field-type')) || el
      const b = box.getBoundingClientRect()
      return { x1: b.left, y1: b.top, x2: b.right, y2: b.bottom }
    })
    if (r.x2 > r.x1 && r.y2 > r.y1) trovati.push(r)
  }
  if (!trovati.length) throw new Error(`elementi invisibili per ${sel}`)
  const M = 4
  return [
    {
      x1: Math.min(...trovati.map((r) => r.x1)) - M,
      y1: Math.min(...trovati.map((r) => r.y1)) - M,
      x2: Math.max(...trovati.map((r) => r.x2)) + M,
      y2: Math.max(...trovati.map((r) => r.y2)) + M,
    },
  ]
}

/** Se qualche riquadro esce sotto la finestra, scorre la pagina quanto basta (se si può). */
async function inquadra(page, scena, { larghezza, altezza }) {
  const tutti = (await Promise.all(scena.segni.map((s) => rettangoli(page, s.sel)))).flat()
  const basso = Math.max(...tutti.map((r) => r.y2))
  const alto = Math.min(...tutti.map((r) => r.y1))
  if (basso <= altezza) return
  const delta = Math.min(basso - altezza + 24, Math.max(0, alto - 24))
  await page.mouse.move(larghezza / 2, altezza / 2)
  await page.mouse.wheel(0, delta)
  await page.waitForTimeout(400)
}

async function segniDellaScena(page, scena, { larghezza, altezza }) {
  const pc = (v, tot) => Math.round((Math.min(Math.max(v, 0), tot) / tot) * 10000) / 100
  const segni = []
  for (const s of scena.segni) {
    for (const r of await rettangoli(page, s.sel)) {
      const x = pc(r.x1, larghezza)
      const y = pc(r.y1, altezza)
      segni.push({ n: s.n, x, y, w: pc(r.x2, larghezza) - x, h: pc(r.y2, altezza) - y })
    }
  }
  return segni
}

const dimensioni = (scena) => ({
  larghezza: scena.larghezza ?? LARGHEZZA,
  altezza: scena.altezza ?? ALTEZZA,
})

async function fotografa(browser, scena, tema) {
  const { context, page } = await apriSessione(browser, scena.ruolo, TEMI[tema], dimensioni(scena))
  const contesto = { docente: docenteDiProva, api, account }
  const url = typeof scena.url === 'function' ? await scena.url(contesto) : scena.url
  await page.goto(`${BASE}${url}`)
  await page.waitForLoadState('networkidle')
  await menuAperto(page, Boolean(scena.menu))
  if (scena.prima) await scena.prima(page, contesto)
  await page.waitForTimeout(800)
  await inquadra(page, scena, dimensioni(scena))
  const segni = tema === 'chiaro' ? await segniDellaScena(page, scena, dimensioni(scena)) : []
  const png = await page.screenshot()
  await sharp(png)
    .webp({ quality: 82 })
    .toFile(new URL(`${scena.id}-${tema}.webp`, cartellaImmagini).pathname)
  await context.close()
  return segni
}

/* ---------- Avvio ---------- */

const filtro = process.argv[2]
const scene = SCENE.filter((s) => !filtro || s.id.startsWith(filtro))
mkdirSync(cartellaImmagini, { recursive: true })
let dati = {}
try {
  dati = JSON.parse(readFileSync(fileDati, 'utf8'))
} catch {}

await entraComeAdmin()
const browser = await chromium.launch(
  process.env.PW_CHROMIUM_PATH ? { executablePath: process.env.PW_CHROMIUM_PATH } : {},
)
const errori = []
for (const scena of scene) {
  try {
    const segni = await fotografa(browser, scena, 'chiaro')
    await fotografa(browser, scena, 'scuro')
    dati[scena.id] = { ...dimensioni(scena), segni }
    console.log('ok', scena.id)
  } catch (e) {
    errori.push(scena.id)
    console.error('ERRORE', scena.id, e.message.split('\n')[0])
  }
}
await browser.close()
const ordinati = Object.fromEntries(Object.entries(dati).sort(([a], [b]) => a.localeCompare(b)))
writeFileSync(fileDati, JSON.stringify(ordinati, null, 2) + '\n')
if (errori.length) {
  console.error(`${errori.length} scene non riuscite: ${errori.join(', ')}`)
  process.exit(1)
}
