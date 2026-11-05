"""
Albo online del sito attuale (4 pagine Breakdance a fisarmonica) → src/seed/albo-wp.json.

Ogni pagina è una sezione dell'Albo; ogni pannello della fisarmonica una categoria; dentro,
i titoli in grassetto aprono un atto e gli elenchi di link sono i suoi documenti. I titoli
«A.A. 2025/2026» o «Anno 2025» non sono atti: danno l'anno agli atti che seguono.

Uso (con il database del sito attuale caricato in MariaDB locale, schema `wp`):
    python3 scripts/wp/estrai-albo.py
"""
import html
import json
import re
import subprocess
from pathlib import Path

SEZIONI = {
    3404: 'bandi-di-concorso',
    3433: 'bandi-generici',
    3446: 'bandi-di-gara',
    5015: 'sindacale',
}
ANNO = re.compile(r'^(?:A\.?\s?A\.?|anno accademico|anno)\s*(\d{4}(?:\s*[/-]\s*\d{2,4})?)$', re.I)


def breakdance(post_id):
    out = subprocess.run(
        ['mysql', '-uroot', 'wp', '--default-character-set=utf8mb4', '-N', '-r', '-e',
         f"SELECT meta_value FROM wpey_postmeta WHERE post_id={post_id} AND meta_key='_breakdance_data'"],
        capture_output=True, text=True, check=True).stdout
    return json.loads(json.loads(out)['tree_json_string'])['root']


def testo(s):
    s = re.sub(r'<br\s*/?>', ' ', s or '')
    s = html.unescape(re.sub(r'<[^>]+>', '', s))
    return re.sub(r'\s+', ' ', s).strip(' -–')


def main():
    atti = []
    for pid, sezione in SEZIONI.items():
        categoria, anno, atto = None, None, None

        def chiudi():
            nonlocal atto
            if atto and atto['documenti']:
                atti.append(atto)
            atto = None

        def visita(n):
            nonlocal categoria, anno, atto
            data = n.get('data', {})
            tipo = data.get('type', '').split('\\')[-1]
            prop = data.get('properties') or {}
            c = prop.get('content') or {}
            if tipo == 'AccordionContent':
                chiudi()
                categoria = testo((c.get('content') or {}).get('title') or c.get('title') or '')
                anno = None
            elif tipo in ('RichText', 'Text', 'Heading') and categoria:
                t = testo((c.get('content') or {}).get('text') or c.get('text') or '')
                if t and len(t) > 2 and 'breakdance_dynamic' not in t:
                    m = ANNO.match(t)
                    chiudi()
                    if m:
                        anno = m.group(1).replace(' ', '')
                    else:
                        atto = {'sezione': sezione, 'categoria': categoria, 'anno': anno, 'titolo': t, 'documenti': []}
            elif tipo == 'IconList' and categoria:
                for it in (c.get('content') or {}).get('list') or []:
                    url = ((it.get('link') or {}).get('url') or '').strip()
                    nome = testo(it.get('text'))
                    if not url:
                        continue
                    if atto is None:
                        # documenti senza titolo sopra: ognuno è un atto a sé
                        atti.append({'sezione': sezione, 'categoria': categoria, 'anno': anno,
                                     'titolo': nome or url.rsplit('/', 1)[-1], 'documenti': [{'nome': nome or 'Documento', 'url': url}]})
                    else:
                        atto['documenti'].append({'nome': nome or url.rsplit('/', 1)[-1], 'url': url})
            for ch in n.get('children', []):
                visita(ch)

        visita(breakdance(pid))
        chiudi()
    for a in atti:
        # data di pubblicazione: il primo mese di caricamento dei documenti (/uploads/AAAA/MM/)
        mesi = sorted(re.findall(r'/uploads/(\d{4})/(\d{2})/', ' '.join(d['url'] for d in a['documenti'])))
        a['pubblicatoIl'] = f'{mesi[0][0]}-{mesi[0][1]}-01' if mesi else None
        m = re.search(r'scad\.?\w*\s*(?:il\s*)?(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})', ' '.join([a['titolo']] + [d['nome'] for d in a['documenti']]), re.I)
        a['scadenza'] = f'{m.group(3)}-{int(m.group(2)):02d}-{int(m.group(1)):02d}' if m else None
    dest = Path(__file__).resolve().parents[2] / 'src/seed/albo-wp.json'
    dest.write_text(json.dumps(atti, ensure_ascii=False, indent=1) + '\n')
    print(len(atti), 'atti,', sum(len(a['documenti']) for a in atti), 'documenti')


if __name__ == '__main__':
    main()
