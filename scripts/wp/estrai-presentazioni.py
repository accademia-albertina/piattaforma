"""
Calendario delle presentazioni di scuole e corsi (PDF della segreteria) → due calendari JSON
(tipo «presentazioni») per src/seed/calendari/: uno per le scuole e uno per i corsi.

Il risultato va riletto a mano contro il PDF: le celle unite e centrate in verticale
possono finire sulla riga della scuola precedente (es. Nuove tecnologie dell’arte).

Uso: python3 scripts/wp/estrai-presentazioni.py CALENDARIO-PRESENTAZIONE.pdf 2026/2027
"""
import json
import re
import sys
from pathlib import Path

import pdfplumber

AVVERTENZA = 'Alcune date o aule potrebbero cambiare: seguite sempre gli aggiornamenti del calendario e gli avvisi sul sito.'


def pulisci(s):
    """Unisce gli a capo dovuti alla colonna stretta; tiene quelli tra voci distinte."""
    out = ''
    for x in [x.strip() for x in (s or '').split('\n') if x.strip()]:
        if not out:
            out = x
        elif re.match(r"^[a-zàèéìòù(’'-]", x) or re.search(
            r'(\b(e|di|del|della|dei|delle|il|la|le|per|a|da|con|in|che)|,)$', out
        ):
            out += ' ' + x
        else:
            out += '\n' + x
    return out


def nome(s):
    """ORIGONI MATTEO ALDO → Origoni Matteo Aldo (lascia com'è «DOCENTE DA NOMINARE»)."""
    s = ' '.join((s or '').split())
    if 'NOMINARE' in s.upper():
        return 'Docente da nominare'
    return re.sub(r"[A-ZÀ-Ý][A-ZÀ-Ý'’]*", lambda m: m.group(0).capitalize(), s) if s.isupper() else s


def main(pdf, anno):
    scuole, corsi = [], []
    sezione = 'scuole'
    ultimo = ''
    with pdfplumber.open(pdf) as p:
        for pg in p.pages:
            if 'PRESENTAZIONI CORSI' in (pg.extract_text() or '').upper():
                sezione, ultimo = 'corsi', ''
            for t in pg.extract_tables():
                for r in t:
                    # Le tabelle hanno colonne di contorno: contano solo le celle presenti (None = unita).
                    v = [x for x in r if x is not None]
                    if len(v) > 3:
                        v = [x for x in v if x.strip()] or v[:3]
                    elif len(v) == 3 and not v[0].strip() and not v[1].strip() and r[0] is None:
                        v = v
                    testa = ' '.join(v).strip().upper()
                    if not testa or testa.startswith(('SCUOLE', 'DISCIPLINA', '')) and 'DOCENTE' in testa and len(v) == 3 and not v[0].strip():
                        continue
                    if testa.startswith(('SCUOLE ', 'DISCIPLINA ')):
                        continue
                    if len(v) == 1:
                        continue  # tabelline a una colonna: ripetono testo già presente nelle celle
                    if len(v) == 2:
                        # solo il nome della scuola, ripetuto su più righe
                        if r[0] is not None and r[0].strip():
                            ultimo = ' '.join(r[0].split())
                        continue
                    a, b, c = v[0], v[1], v[2]
                    if a.strip():
                        ultimo = ' '.join(a.split())
                    if not b.strip() and not c.strip():
                        continue
                    if sezione == 'scuole':
                        scuole.append({'scuola': ultimo.replace(' E ', ' e '), 'quando': pulisci(b), 'dove': pulisci(c)})
                    elif corsi and not b.strip() and corsi[-1]['scuola'] == ultimo:
                        # cella spezzata dal cambio pagina: continua la riga sopra
                        corsi[-1]['quando'] = pulisci(corsi[-1]['quando'] + '\n' + c)
                    else:
                        corsi.append({'scuola': ultimo, 'quando': pulisci(c), 'dove': nome(b)})
    dest = Path(__file__).resolve().parents[2] / 'src/seed/calendari'
    a = anno.replace('/', '-')
    for titolo, righe, file in (
        ('Presentazioni delle scuole', scuole, f'presentazioni-scuole-{a}.json'),
        ('Presentazioni dei corsi', corsi, f'presentazioni-corsi-{a}.json'),
    ):
        dati = {
            'tipo': 'presentazioni',
            'titolo': titolo,
            'annoAccademico': anno,
            'avvertenze': AVVERTENZA,
            'righe': righe,
        }
        (dest / file).write_text(json.dumps(dati, ensure_ascii=False, indent=1) + '\n')
        print(file, len(righe))


if __name__ == '__main__':
    main(sys.argv[1], sys.argv[2])
