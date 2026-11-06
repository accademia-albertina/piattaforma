// Genera src/app/(payload)/_icone-menu.scss: le icone del menu laterale del pannello.
// Il menu di Payload non accetta icone, quindi si aggiungono via CSS (maschera SVG che
// prende il colore del testo). Rilancia lo script se cambi ICONE_SEZIONI:
//   node scripts/icone-pannello.mjs && npx prettier --write "src/app/(payload)/_icone-menu.scss"
import { writeFileSync } from 'node:fs'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import * as lucide from 'lucide-react'

const ICONE = {
  'nav-pagine': 'FileText',
  'nav-avvisi': 'Megaphone',
  'nav-media': 'Images',
  'nav-corsi': 'BookOpen',
  'nav-docenti': 'GraduationCap',
  'nav-dottorandi': 'Microscope',
  'nav-calendari': 'CalendarDays',
  'nav-albo': 'ClipboardList',
  'nav-trasparenza': 'Scale',
  'nav-scuole': 'Landmark',
  'nav-pubblicazioni': 'LibraryBig',
  'nav-users': 'Users',
  'nav-global-navigazione': 'PanelsTopLeft',
}

const svg = (nome) =>
  renderToStaticMarkup(
    createElement(lucide[nome], { size: 20, strokeWidth: 1.5, color: '#000' }),
  ).replace(/ class="[^"]*"/, '')

let out = `// FILE GENERATO da scripts/icone-pannello.mjs: non modificarlo a mano.\n\n`
for (const [id, nome] of Object.entries(ICONE)) {
  out += `#${id}::before {\n  mask-image: url("data:image/svg+xml,${encodeURIComponent(svg(nome))}");\n}\n\n`
}
writeFileSync(new URL('../src/app/(payload)/_icone-menu.scss', import.meta.url), out)
console.log('ok', Object.keys(ICONE).length, 'icone')
