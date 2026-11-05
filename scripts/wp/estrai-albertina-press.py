"""
Estrae il catalogo Albertina Press (CPT `pubblicazione-ap`) dal dump WordPress in JSON.
Uso: python3 scripts/wp/estrai-albertina-press.py > /tmp/albertina-press.json
Richiede il dump del sito attuale in MariaDB (schema `wp`, prefisso `wpey_`).
"""
import base64
import html
import json
import re
import subprocess
import sys


def q(sql):
    sql = sql.replace('SELECT JSON_OBJECT', 'SELECT TO_BASE64(JSON_OBJECT', 1).replace(') FROM', ')) FROM', 1)
    out = subprocess.run(['mysql', '-uroot', 'wp', '--default-character-set=utf8mb4', '-N', '-e', sql],
                         capture_output=True, text=True, check=True).stdout
    return [json.loads(base64.b64decode(l.replace('\\n', '')).decode('utf8')) for l in out.splitlines() if l.strip()]


DOVE = "p.post_type='pubblicazione-ap' AND p.post_status='publish'"
posts = q(f"SELECT JSON_OBJECT('id',ID,'titolo',post_title,'slug',post_name,'data',post_date) FROM wpey_posts p WHERE {DOVE}")
meta = {}
for r in q(f"SELECT JSON_OBJECT('id',post_id,'k',meta_key,'v',meta_value) FROM wpey_postmeta m JOIN wpey_posts p ON p.ID=m.post_id WHERE {DOVE} AND meta_key NOT LIKE '\\_%' AND meta_key NOT LIKE 'advgb%' AND meta_key NOT LIKE 'rank_math%'"):
    meta.setdefault(r['id'], {})[r['k']] = r['v']
copertine = {r['id']: r['url'] for r in q(f"SELECT JSON_OBJECT('id',m.post_id,'url',a.guid) FROM wpey_postmeta m JOIN wpey_posts p ON p.ID=m.post_id JOIN wpey_posts a ON a.ID=m.meta_value WHERE {DOVE} AND m.meta_key='_thumbnail_id'")}


def pulito(v):
    v = (v or '').replace('\r\n', '\n').strip()
    return None if v in ('', '/', '-') else v


def numero(v):
    v = pulito(v)
    if not v:
        return None
    m = re.search(r'\d+(?:[.,]\d+)?', v)
    return float(m.group().replace(',', '.')) if m else None


def voci_indice(v):
    """'11 – <em>Prefazione</em> / Salvo Bitonti' → {pagina, titolo, autori}, una voce per riga."""
    voci = []
    for riga in re.split(r'\n+', v or ''):
        t = html.unescape(re.sub(r'<[^>]+>', '', riga)).replace('\xa0', ' ').strip()
        if not t:
            continue
        m = re.match(r'^(\d+[a-z]?)\s*[-–—]\s*(.+)$', t)
        pagina, resto = (m.group(1), m.group(2)) if m else (None, t)
        parti = re.split(r'\s*/\s*', resto, maxsplit=1)
        titolo = re.sub(r'\s+', ' ', parti[0]).strip(' –-')
        autori = re.sub(r'\s+', ' ', parti[1]).strip() if len(parti) > 1 else None
        if titolo:
            voci.append({'pagina': pagina, 'titolo': titolo, 'autori': autori or None})
    return voci


out = []
for p in posts:
    m = meta.get(p['id'], {})
    luogo_anno = pulito(m.get('luogo_e_anno_di_pubblicazione'))
    # L'anno affidabile è quello scritto in "luogo e anno"; il campo anno è spesso rimasto di default
    anni = re.findall(r'(?:19|20)\d\d', luogo_anno or '')
    anno = int(anni[-1]) if anni else (int(m['anno_di_pubblicazione']) if pulito(m.get('anno_di_pubblicazione')) else None)
    url = copertine.get(p['id'])
    out.append({
        'wpId': p['id'],
        'titolo': p['titolo'].strip(),
        'slug': p['slug'],
        'numero': int(m['numero_catalogo']) if (m.get('numero_catalogo') or '').strip().isdigit() else None,
        'collana': pulito(m.get('collana')),
        'autori': pulito(m.get('autori')),
        'luogoAnno': luogo_anno,
        'anno': anno,
        'pagine': int(numero(m.get('numero_di_pagine'))) if numero(m.get('numero_di_pagine')) else None,
        'dimensioni': pulito(m.get('dimensioni')),
        'lingua': pulito(m.get('lingua')),
        'isbn': pulito(m.get('isbn')),
        'prezzo': numero(m.get('prezzo')),
        'descrizione': html.unescape(re.sub(r'<[^>]+>', '', pulito(m.get('descrizione')) or '')).strip() or None,
        'indice': voci_indice(m.get('indice')),
        'copertina': url.replace('http://', 'https://') if url else None,
    })
out.sort(key=lambda o: (o['numero'] or 0), reverse=True)
json.dump(out, sys.stdout, ensure_ascii=False, indent=1)
print(f"{len(out)} pubblicazioni, {sum(1 for o in out if o['copertina'])} con copertina", file=sys.stderr)
