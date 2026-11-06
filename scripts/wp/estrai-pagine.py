"""
Estrae le pagine istituzionali dal database WordPress (Breakdance) in un JSON di blocchi con HTML,
che scripts/wp/converti-pagine.ts trasforma nel formato di Payload. Uso:
  python3 scripts/wp/estrai-pagine.py > /tmp/pagine-wp.json
Richiede il dump del sito attuale in MariaDB (schema `wp`, prefisso `wpey_`).
Le pagine si spostano dove serve (es. Erasmus) e i link interni puntano ai nuovi indirizzi.
"""
import html
import json
import re
import subprocess
import sys

# id WordPress → percorso nella nuova piattaforma. L'ordine conta: prima i genitori.
PAGINE = {
    1975: 'accademia',
    3477: 'accademia/storia-e-sedi',
    3491: 'accademia/ordinamento',
    3498: 'accademia/organigramma',
    8789: 'accademia/il-saluto-del-direttore',
    3508: 'accademia/biblioteca',
    13027: 'accademia/albertina-press',
    1973: 'didattica',
    3468: 'didattica/piani-di-studio',
    3569: 'didattica/manifesto-degli-studi',
    3731: 'didattica/trasferimenti',
    5114: 'didattica/ammissioni',
    5124: 'didattica/iscrizioni',
    1467: 'studente',
    972: 'studente/tesi',
    2188: 'studente/segreteria-didattica',
    3627: 'studente/tasse',
    3737: 'studente/stage-tirocinio',
    3742: 'studente/borse-di-studio',
    3745: 'studente/consulta',
    8192: 'studente/modulistica',
    8571: 'studente/sportelli',
    30894: 'studente/tutoraggio-interculturale',
    2209: 'dottorati',
    2586: 'dottorati/albertina',
    3463: 'dottorati/convenzionati',
    24397: 'dottorati/albertina/dottorandi',
    2212: 'erasmus',
    # Sul sito attuale sono di primo livello, ma il menu e la pagina Erasmus le cercano qui
    30951: 'erasmus/bandi',
    27593: 'erasmus/mobilita-studenti',
    27661: 'erasmus/mobilita-docenti-staff',
    27652: 'erasmus/incoming-students',
    1916: 'contatti',
    25402: 'open-data',
    5651: 'segnalazioni-di-accessibilita',
    3: 'privacy-policy',
    4952: 'cookie-policy',
    4971: 'termini-e-condizioni',
}

# Profili dei dottorandi (sottopagine di Dottorandi): vanno nella collezione Dottorandi, non in
# Pagine. Con --dottorandi lo script estrae solo quelli, per scripts/wp/converti-dottorandi.ts.
if '--dottorandi' in sys.argv:
    PAGINE = {}
    for _r in subprocess.run(
        ['mysql', '-N', 'wp', '-e', "select ID, post_name from wpey_posts where post_type='page' and post_status='publish' and post_parent=24397 order by post_title"],
        capture_output=True, check=True,
    ).stdout.decode().splitlines():
        _i, _s = _r.split('\t')
        PAGINE[int(_i)] = f'dottorati/albertina/dottorandi/{_s}'

SITO = 'https://albertina-academy.it'
# Etichette dei box che rimandano alle sottopagine: la piattaforma le mostra già da sola
CARD = re.compile(r'^(scopri di più|leggi tutto|visita il sito)$', re.I)
# Placeholder rimasti nei moduli di Breakdance (domande in inglese, lorem ipsum)
SEGNAPOSTO = re.compile(r'lorem ipsum|convallis tellus|lifetime license|edit my address|free copy of a magazine', re.I)
SALTA = {
    'Breadcrumbs', 'TableOfContents', 'Image', 'Image2', 'ImageAccordion', 'PostsLoop', 'Postslist',
    'Shortcode', 'FormBuilder', 'LoginForm', 'RegisterForm', 'ForgotPasswordForm', 'Icon', 'PulseDot',
    'Badge', 'FancyDivider', 'CodeBlock', 'GoogleMap', 'LogoList', 'SimpleCounter', 'WrapperLink',
}


def q(sql):
    out = subprocess.run(['mysql', '-N', '-r', 'wp', '-e', sql], capture_output=True, check=True)
    return out.stdout.decode('utf8', 'replace')


def percorso_vecchio():
    """Percorso di ogni pagina sul sito attuale, per riscrivere i link interni."""
    righe = q("select ID, post_parent, post_name from wpey_posts where post_type='page' and post_status='publish'")
    pagine = {}
    for r in righe.splitlines():
        i, g, s = r.split('\t')
        pagine[int(i)] = (int(g), s)

    def path(i):
        g, s = pagine[i]
        return (path(g) + '/' if g in pagine else '') + s

    return {path(i): PAGINE[i] for i in pagine if i in PAGINE}


VECCHI = percorso_vecchio()
# Pagine diventate sezioni della piattaforma
VECCHI.update({p: p for p in PAGINE.values()})
VECCHI.update({
    'didattica/docenti': 'docenti',
    'docenti': 'docenti',
    'corsi': 'corsi',
    'avvisi': 'avvisi',
    'calendari': 'calendari',
    'calendario': 'calendari',
    'didattica/segreteria': 'studente/segreteria-didattica',
    'studenti/consulta': 'studente/consulta',
    'outgoing': 'erasmus/mobilita-studenti',
    'incoming': 'erasmus/incoming-students',
    'docenti-e-staff': 'erasmus/mobilita-docenti-staff',
    'bandi-erasmus': 'erasmus/bandi',
    'studente/trasferimenti': 'didattica/trasferimenti',
    'didattica/ammissioni-e-iscrizioni': 'didattica/ammissioni',
})


def _docenti():
    """Slug WordPress del docente (a.balzola) → indirizzo del profilo nella piattaforma (andrea-balzola)."""
    import gzip
    import os
    import unicodedata
    file = os.path.join(os.path.dirname(__file__), '../../src/seed/docenti-wp.json.gz')
    def slug(t):
        t = unicodedata.normalize('NFKD', t).encode('ascii', 'ignore').decode().lower()
        return re.sub(r'[^a-z0-9]+', '-', t).strip('-')
    return {d['slugWp']: slug(f"{d['nome']} {d['cognome']}") for d in json.load(gzip.open(file))}


DOCENTI = _docenti()


def nuovo_percorso(p):
    p = p.strip('/')
    if p in VECCHI:
        return VECCHI[p]
    if p.startswith('docente/'):
        d = DOCENTI.get(p.split('/', 1)[1].replace('.', '-'))
        return f'docenti/{d}' if d else None
    if p.startswith('calendario/'):
        return 'calendari'
    return None


def riscrivi_link(s):
    def sost(m):
        nuovo = nuovo_percorso(m.group(2))
        if nuovo:
            return f'{m.group(1)}/{nuovo}{m.group(3) or ""}'
        return m.group(0)

    s = re.sub(r'https?://web\.archive\.org/web/\d+/', '', s)

    s = re.sub(r'(href=")(?:https?://(?:www\.)?(?:albertina-academy\.it|newalbertina\.eu))?(/[\w\-/.]*?)/?(#[\w-]*)?(?=")', sost, s)
    return s


def pulisci_html(s):
    s = s or ''
    s = re.sub(r'\[breakdance_dynamic[^\]]*\]', '', s)
    s = re.sub(r'<(div|span|article|section)[^>]*>', '', s)
    s = re.sub(r'</(div|span|article|section)>', '', s)
    s = re.sub(r'\sstyle="[^"]*"', '', s)
    s = re.sub(r'\sclass="[^"]*"', '', s)
    s = re.sub(r'\sid="[^"]*"', '', s)
    return riscrivi_link(s).strip()


def url_link(link):
    if not link:
        return None
    t = link.get('type')
    if t == 'contact':
        c = link.get('contact') or {}
        if c.get('type') == 'email' and c.get('email'):
            return 'mailto:' + c['email']
        if c.get('type') == 'phone' and c.get('phone'):
            return 'tel:' + re.sub(r'\s', '', c['phone'])
        return None
    if t != 'url':
        return None
    u = (link.get('url') or '').strip()
    if not u or u.startswith('#'):
        return None
    u = re.sub(r'https?://(www\.)?newalbertina\.eu', SITO, u)
    if u.startswith('/'):
        u = SITO + u
    m = re.match(r'https?://(?:www\.)?albertina-academy\.it(/[^?#]*)?', u)
    if m and not re.search(r'\.\w{2,4}$', m.group(1) or ''):
        nuovo = nuovo_percorso(m.group(1) or '/')
        if nuovo:
            return '/' + nuovo
    return u


class Pagina:
    def __init__(self):
        self.blocchi = []
        self.html = []
        self.contatti = []

    def chiudi_testo(self):
        h = ''.join(self.html).strip()
        if re.sub(r'<[^>]+>|\s|&nbsp;', '', h):
            self.blocchi.append({'tipo': 'testo', 'html': h})
        self.html = []

    def aggiungi_link(self, etichetta, url):
        etichetta = html.unescape(re.sub(r'<[^>]+>', '', etichetta or '')).strip()
        if not url or not etichetta:
            return
        if url.startswith('mailto:') or url.startswith('tel:') or url.startswith('http://'):
            # Nel blocco link vanno solo indirizzi https e del sito: il resto resta nel testo
            self.html.append(f'<p><a href="{html.escape(url)}">{html.escape(etichetta)}</a></p>')
            return
        self.chiudi_testo()
        ult = self.blocchi[-1] if self.blocchi else None
        if not ult or ult['tipo'] != 'link':
            ult = {'tipo': 'link', 'voci': []}
            self.blocchi.append(ult)
        if not any(v['url'] == url for v in ult['voci']):
            ult['voci'].append({'etichetta': etichetta[:200], 'url': url})

    def aggiungi_voce(self, titolo, contenuto):
        if not re.sub(r'<[^>]+>|\s|&nbsp;', '', contenuto):
            return
        self.chiudi_testo()
        ult = self.blocchi[-1] if self.blocchi else None
        if not ult or ult['tipo'] != 'fisarmonica':
            ult = {'tipo': 'fisarmonica', 'voci': []}
            self.blocchi.append(ult)
        ult['voci'].append({'titolo': html.unescape(re.sub(r'<[^>]+>', '', titolo)).strip()[:200], 'html': contenuto})


def contenuto(n):
    """Proprietà del contenuto: quasi sempre in content.content; FAQ e tabelle stanno un livello sopra."""
    c = (n.get('data', {}).get('properties') or {}).get('content') or {}
    return {**c, **(c.get('content') or {})}


def tipo(n):
    return n.get('data', {}).get('type', '').split('\\')[-1]


def html_di(nodi):
    """HTML semplice di un sottoalbero (per il contenuto di fisarmoniche e schede)."""
    p = Pagina()
    for n in nodi:
        visita(n, p, annidato=True)
    p.chiudi_testo()
    out = []
    for b in p.blocchi:
        if b['tipo'] == 'testo':
            out.append(b['html'])
        elif b['tipo'] == 'link':
            out.append('<ul>' + ''.join(f'<li><a href="{html.escape(v["url"])}">{html.escape(v["etichetta"])}</a></li>' for v in b['voci']) + '</ul>')
        elif b['tipo'] == 'fisarmonica':
            for v in b['voci']:
                out.append(f'<h3>{html.escape(v["titolo"])}</h3>{v["html"]}')
    return ''.join(out)


def tabella(c):
    colonne = (c.get('table') or {}).get('table') or []
    intest = [html.unescape(re.sub(r'<br\s*/?>', ' ', col.get('header') or '')).strip() for col in colonne]
    righe = max((len(col.get('table_data') or []) for col in colonne), default=0)
    if righe == 0:
        return ''
    out = []
    for r in range(righe):
        celle = []
        for i, col in enumerate(colonne):
            dati = col.get('table_data') or []
            v = (dati[r].get('data') if r < len(dati) else '') or ''
            v = re.sub(r'<[^>]+>', ' ', v).strip()
            if v:
                celle.append(f'<strong>{html.escape(intest[i])}:</strong> {html.escape(html.unescape(v))}' if intest[i] else html.escape(v))
        if celle:
            out.append('<li>' + ' · '.join(celle) + '</li>')
    return '<ul>' + ''.join(out) + '</ul>' if out else ''


def testo_semplice(h):
    h = re.sub(r'<br\s*/?>|</p>', '\n', h)
    return '\n'.join(r.strip() for r in html.unescape(re.sub(r'<[^>]+>', '', h)).splitlines() if r.strip())


def schede_contatto(figli):
    """Griglia di schede "ufficio + persone + email" (pagina Contatti): diventa un blocco Contatti."""
    voci = []
    for d in figli:
        if tipo(d) != 'Div':
            return None
        nome, corpo = None, ''
        for f in d.get('children', []):
            c = contenuto(f)
            if tipo(f) in ('Text', 'TextLink', 'Button') and c.get('text') and not nome:
                nome = html.unescape(re.sub(r'<[^>]+>', '', c['text'])).strip()
            elif tipo(f) == 'RichText':
                corpo += c.get('text') or ''
        if not nome or not corpo:
            return None
        email = re.search(r'mailto:([\w.+-]+@[\w.-]+)', corpo)
        paragrafi = re.findall(r'<p>(.*?)</p>', corpo, re.S)
        persone = testo_semplice(paragrafi[0]) if paragrafi else ''
        resto = corpo[corpo.find(paragrafi[0]) + len(paragrafi[0]):] if paragrafi else corpo
        orari = [r for r in testo_semplice(resto).splitlines() if '@' not in r]
        voci.append({
            'nome': nome,
            'ruolo': persone.replace('\n', ', ') if persone and '@' not in persone else None,
            'email': email.group(1) if email else None,
            'orari': '\n'.join(orari) or None,
        })
    return voci if len(voci) >= 3 else None


def visita(n, p, annidato=False):
    t = tipo(n)
    c = contenuto(n)
    figli = n.get('children', [])
    if t in SALTA:
        return
    if t == 'Heading':
        testo = c.get('text') or ''
        tag = c.get('tags') or 'h2'
        if tag == 'h1' or 'breakdance_dynamic' in testo or not testo.strip():
            return
        livello = 'h2' if tag == 'h2' and not annidato else 'h3'
        p.html.append(f'<{livello}>{pulisci_html(testo)}</{livello}>')
        return
    if t in ('RichText', 'Text'):
        testo = pulisci_html(c.get('text'))
        if not testo or SEGNAPOSTO.search(testo):
            return
        p.html.append(testo if testo.startswith('<') else f'<p>{testo}</p>')
        return
    if t == 'NotificationBar':
        titolo, desc = c.get('title') or '', c.get('description') or ''
        if SEGNAPOSTO.search(titolo + desc):
            return
        p.html.append(f'<p><strong>{pulisci_html(titolo)}</strong>{" " if titolo else ""}{pulisci_html(desc)}</p>')
        return
    if t == 'AccordionContent':
        p.aggiungi_voce(c.get('title') or 'Dettagli', html_di(figli))
        return
    if t == 'FrequentlyAskedQuestions':
        for d in (c.get('settings') or {}).get('questions') or []:
            if SEGNAPOSTO.search((d.get('question') or '') + (d.get('answer') or '')):
                continue
            p.aggiungi_voce(d.get('question') or '', pulisci_html(d.get('answer')))
        return
    if t == 'AdvancedTabs':
        schede = c.get('tabs') or []
        contenuti = [f for f in figli if tipo(f) == 'TabContent']
        for i, s in enumerate(schede):
            corpo = html_di(contenuti[i].get('children', [])) if i < len(contenuti) else pulisci_html(s.get('content'))
            if SEGNAPOSTO.search(corpo):
                continue
            p.aggiungi_voce(s.get('title') or f'Scheda {i + 1}', corpo)
        return
    if t in ('IconList', 'BasicList'):
        voci = c.get('list') or c.get('items') or []
        for v in voci:
            p.aggiungi_link(v.get('text'), url_link(v.get('link')))
        return
    if t in ('Button', 'TextLink'):
        u = url_link(c.get('link'))
        if u and u.startswith('mailto:') and not annidato:
            p.contatti.append(u[7:])
            return
        p.aggiungi_link(c.get('text') or u, u)
        return
    if t == 'ImageBox':
        if c.get('title'):
            p.html.append(f'<p><strong>{html.escape(c["title"])}</strong>{(" – " + html.escape(c["text"])) if c.get("text") else ""}</p>')
        return
    if t == 'Grid' and not annidato:
        voci = schede_contatto(figli)
        if voci:
            titolo = None
            m = re.search(r'<h2>((?:(?!<h2>).)*?)</h2>$', ''.join(p.html), re.S)
            if m:
                titolo = html.unescape(re.sub(r'<[^>]+>', '', m.group(1))).strip()
                p.html = [''.join(p.html)[: m.start()]]
            p.chiudi_testo()
            p.blocchi.append({'tipo': 'contatti', 'titolo': titolo, 'voci': voci})
            return
    if t == 'DeTable':
        didascalia = ((c.get('table') or {}).get('caption') or '').strip()
        corpo = tabella(c)
        if corpo:
            if didascalia:
                p.html.append(f'<p><strong>{html.escape(didascalia)}</strong></p>')
            p.html.append(corpo)
        return
    for f in figli:
        visita(f, p, annidato)


def senza_box(blocchi):
    """Toglie i box "Scopri di più" verso le sottopagine (titolo, riga e link) e, se resta
    solo un paragrafo d'apertura, lo usa come sommario della pagina."""
    out = []
    for b in blocchi:
        if b['tipo'] == 'link' and all(CARD.match(v['etichetta']) for v in b['voci']):
            if out and out[-1]['tipo'] == 'testo':
                h = re.sub(r'(<h[2-6]>(?:(?!<h[2-6]>).)*?</h[2-6]>)(<p>(?:(?!<p>).)*?</p>)?$', '', out[-1]['html'], flags=re.S)
                if re.sub(r'<[^>]+>|\s|&nbsp;', '', h):
                    out[-1]['html'] = h
                else:
                    out.pop()
            continue
        out.append(b)
    sommario = None
    if len(out) == 1 and out[0]['tipo'] == 'testo' and re.fullmatch(r'<p>((?:(?!<p>).)*?)</p>', out[0]['html'], re.S):
        testo = re.sub(r'<br\s*/?>', ' ', out[0]['html'])
        sommario = html.unescape(re.sub(r'<[^>]+>', '', testo)).strip()
        if len(sommario) <= 300:
            out = []
        else:
            sommario = None
    return out, sommario


def html_classico(s):
    s = re.sub(r'<!--.*?-->', '', s or '', flags=re.S)
    return pulisci_html(s)


def main():
    ids = ','.join(str(i) for i in PAGINE)
    righe = q(
        "select p.ID, replace(replace(p.post_title,'\\t',' '),'\\n',' '), "
        "coalesce((select meta_value from wpey_postmeta m where m.post_id=p.ID and m.meta_key='_breakdance_data' limit 1),''), "
        f"replace(replace(replace(p.post_content,'\\\\','\\\\\\\\'),'\\t','\\\\t'),'\\n','\\\\n') from wpey_posts p where p.ID in ({ids})"
    )
    dati = {}
    for r in righe.splitlines():
        i, titolo, bd, classico = r.split('\t', 3)
        dati[int(i)] = (titolo, bd, classico.replace('\\n', '\n').replace('\\t', '\t').replace('\\\\', '\\'))
    out = []
    for wp_id, percorso in PAGINE.items():
        if wp_id not in dati:
            print(f'manca {wp_id}', file=sys.stderr)
            continue
        titolo, bd, classico = dati[wp_id]
        p = Pagina()
        if bd:
            albero = json.loads(json.loads(bd)['tree_json_string'])
            visita(albero['root'], p)
        else:
            p.html.append(html_classico(classico))
        p.chiudi_testo()
        blocchi, sommario = senza_box(p.blocchi)
        p.blocchi = blocchi
        if wp_id == 1916:
            p.contatti = []  # Contatti: PEO e PEC sono già nel footer
        if p.contatti:
            p.blocchi.insert(0, {'tipo': 'contatti', 'voci': [{'nome': titolo, 'email': e} for e in dict.fromkeys(p.contatti)]})
        out.append({
            'wpId': wp_id,
            'titolo': html.unescape(titolo).strip(),
            'percorso': percorso,
            'slug': percorso.split('/')[-1],
            'genitore': '/'.join(percorso.split('/')[:-1]) or None,
            'sommario': sommario,
            'blocchi': p.blocchi,
        })
        print(f'{percorso}: {len(p.blocchi)} blocchi', file=sys.stderr)
    json.dump(out, sys.stdout, ensure_ascii=False, indent=1)


main()
