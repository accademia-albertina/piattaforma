"""Profili docenti dal CSV esportato da WordPress (solo campi pubblici) → JSON per converti-docenti.ts.
Uso: python3 scripts/wp/estrai-docenti.py docenti-profili.csv uscita.json"""
import csv, json, re, sys

GIORNI = {'lun': 'lunedì', 'mar': 'martedì', 'mer': 'mercoledì', 'gio': 'giovedì', 'ven': 'venerdì', 'sab': 'sabato'}
RUOLI = {'Docente a tempo indeterminato': 'tempo-indeterminato', 'Docente a tempo determinato': 'tempo-determinato', 'Docente a contratto': 'contratto'}


def ora(t):
    return re.sub(r'^0?(\d+):(\d\d).*', lambda m: m.group(1) if m.group(2) == '00' else f'{m.group(1)}:{m.group(2)}', t)


def ricevimento(r):
    giorni = [GIORNI[g] for g in re.findall(r's:3:"(\w+)"', r['giorno_ricevimento']) if g in GIORNI]
    if not giorni:
        return None
    testo = ', '.join(giorni[:-1]) + (' e ' if len(giorni) > 1 else '') + giorni[-1]
    testo = testo[0].upper() + testo[1:]
    if r['orario_inizio_ricevimento'] and r['orario_fine_ricevimento']:
        testo += f" {ora(r['orario_inizio_ricevimento'])}–{ora(r['orario_fine_ricevimento'])}"
    return testo + ', su appuntamento via email'


righe = list(csv.DictReader(open(sys.argv[1], encoding='utf-8')))
out = [{
    'wpId': int(r['user_id']), 'slugWp': r['slug'], 'nome': r['nome'].strip(), 'cognome': r['cognome'].strip(),
    'email': r['email_istituzionale'].strip().lower() or None, 'ruolo': RUOLI.get(r['ruolo']),
    'scuole': [s for s in re.split(r'[,|;]\s*', r['scuole']) if s],
    'ricevimento': ricevimento(r), 'foto': r['foto_url'] or None, 'cv': r['cv_url'] or None,
    'biografia': r['biografia_html'] or None,
} for r in righe]
json.dump(out, open(sys.argv[2], 'w'), ensure_ascii=False)
print(len(out), 'docenti;', sum(1 for d in out if d['ricevimento']), 'con ricevimento')
