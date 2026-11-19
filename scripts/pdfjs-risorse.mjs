// Copia in public/pdfjs/<versione>/ i file di PDF.js che il browser scarica a parte:
// il worker, i font standard, le CMap e i decodificatori WebAssembly. Si lancia prima di
// dev, build e Storybook. La cartella è nel .gitignore: si rigenera da node_modules.
// La versione nel percorso evita che il browser tenga in cache un worker di un'altra versione
// (worker e libreria devono coincidere).
import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync } from 'node:fs'
import { createRequire } from 'node:module'
import path from 'node:path'

const require = createRequire(import.meta.url)
const radice = path.dirname(require.resolve('pdfjs-dist/package.json'))
const { version } = JSON.parse(readFileSync(path.join(radice, 'package.json'), 'utf8'))

const base = path.resolve('public/pdfjs')
const dest = path.join(base, version)

if (existsSync(path.join(dest, 'pdf.worker.min.mjs'))) process.exit(0)

// Toglie le versioni precedenti
if (existsSync(base)) {
  for (const voce of readdirSync(base)) rmSync(path.join(base, voce), { recursive: true })
}
mkdirSync(dest, { recursive: true })
cpSync(path.join(radice, 'build/pdf.worker.min.mjs'), path.join(dest, 'pdf.worker.min.mjs'))
for (const cartella of ['standard_fonts', 'cmaps', 'iccs', 'wasm']) {
  cpSync(path.join(radice, cartella), path.join(dest, cartella), {
    recursive: true,
    // quickjs serve solo agli script dentro i PDF, che il visualizzatore non esegue
    filter: (f) => !path.basename(f).startsWith('quickjs'),
  })
}
console.log(`PDF.js ${version}: risorse copiate in public/pdfjs/${version}`)
