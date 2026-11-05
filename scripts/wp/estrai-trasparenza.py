"""
Amministrazione trasparente del sito attuale (CPT `amm-trasparente`, campi ACF) →
src/seed/trasparenza-wp.json: una voce per sottosezione, con sezione del D.Lgs. 33/2013,
testo e documenti (file caricati o link esterni).

Uso (con il database del sito attuale caricato in MariaDB locale, schema `wp`):
    python3 scripts/wp/estrai-trasparenza.py
"""
import base64
import json
import re
import subprocess
from pathlib import Path


def q(sql):
    sql = re.sub(r'\s+', ' ', sql)
    sql = sql.replace('SELECT JSON_OBJECT', 'SELECT TO_BASE64(JSON_OBJECT', 1).replace(') FROM', ')) FROM', 1)
    out = subprocess.run(['mysql', '-uroot', 'wp', '--default-character-set=utf8mb4', '-N', '-e', sql],
                         capture_output=True, text=True, check=True).stdout
    return [json.loads(base64.b64decode(l.replace('\\n', '')).decode('utf8')) for l in out.splitlines() if l.strip()]


def main():
    post = q("""SELECT JSON_OBJECT('id',p.ID,'titolo',p.post_title,'slug',p.post_name,'html',p.post_content,'sezione',t.name,'modificato',p.post_modified)
        FROM wpey_posts p JOIN wpey_term_relationships r ON r.object_id=p.ID
        JOIN wpey_term_taxonomy tt ON tt.term_taxonomy_id=r.term_taxonomy_id AND tt.taxonomy='amministrazione-trasparente'
        JOIN wpey_terms t ON t.term_id=tt.term_id
        WHERE p.post_type='amm-trasparente' AND p.post_status='publish'""")
    meta = {}
    for r in q("""SELECT JSON_OBJECT('id',m.post_id,'k',m.meta_key,'v',m.meta_value) FROM wpey_postmeta m
        JOIN wpey_posts p ON p.ID=m.post_id WHERE p.post_type='amm-trasparente' AND p.post_status='publish'
        AND m.meta_key LIKE 'documenti_da_allegare%'"""):
        meta.setdefault(r['id'], {})[r['k']] = r['v'] or ''
    allegati = {r['id']: r['url'] for r in q("SELECT JSON_OBJECT('id',ID,'url',guid) FROM wpey_posts WHERE post_type='attachment'")}

    voci = []
    for p in post:
        m = meta.get(p['id'], {})
        n = int(m.get('documenti_da_allegare') or 0)
        documenti = []
        for i in range(n):
            g = lambda k: (m.get(f'documenti_da_allegare_{i}_{k}') or '').strip()
            nome, testo = g('nome_documento'), g('testo')
            if g('ti_occorre_inserire_un_link') == 'Si' and g('link'):
                url = g('link')
                nome = g('nome_del_link') or nome
            elif g('documento').isdigit() and int(g('documento')) in allegati:
                url = allegati[int(g('documento'))].replace('http://', 'https://')
            else:
                url = ''
            if nome or url or testo:
                documenti.append({'nome': nome or (url.rsplit('/', 1)[-1] if url else ''), 'url': url, 'nota': testo})
        html = re.sub(r'<!--.*?-->', '', p['html'] or '', flags=re.S).strip()
        voci.append({
            'wpId': p['id'],
            'titolo': p['titolo'].strip(),
            'slug': p['slug'],
            'sezione': p['sezione'].replace('’', '’'),
            'html': html,
            'aggiornatoIl': p['modificato'],
            'documenti': documenti,
        })
    voci.sort(key=lambda v: (v['sezione'], v['titolo']))
    dest = Path(__file__).resolve().parents[2] / 'src/seed/trasparenza-wp.json'
    dest.write_text(json.dumps(voci, ensure_ascii=False, indent=1) + '\n')
    print(len(voci), 'sottosezioni,', sum(len(v['documenti']) for v in voci), 'documenti')


if __name__ == '__main__':
    main()
