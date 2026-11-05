"""
Estrae la tabella dell'orario delle lezioni dal PDF della segreteria in JSON per il seed.
Uso: python3 -I scripts/wp/estrai-orario.py ORARIO.pdf src/seed/calendari/orario-2025-2026.json

Le celle unite del PDF (None in pdfplumber) prendono il valore della riga sopra; a inizio
pagina anche le celle vuote, perché il corso continua dalla pagina precedente.
"""
import json
import re
import sys

import pdfplumber

COLONNE = ['corso', 'livello', 'docenti', 'giorno', 'inizio', 'fine', 'semestre', 'aula']


def pulisci(v):
    """Unisce gli a capo dovuti alla larghezza della colonna; tiene quelli tra voci distinte."""
    if not v:
        return ''
    righe = [r.strip() for r in v.split('\n') if r.strip()]
    out = ''
    for r in righe:
        if not out:
            out = r
        elif re.fullmatch(r'[a-zàèéìòù]{1,3}\)?', r) and r not in ('e', 'ed', 'o', 'od', 'di', 'a', 'per', 'con'):
            out += r  # parola spezzata dalla colonna stretta (es. "Ricevime" + "nto")
        elif out.count('(') > out.count(')'):
            out += ' ' + r  # dentro una parentesi
        elif re.match(r'^[a-zàèéìòù0-9°’\'-]', r) and not re.match(r'^(lunedì|martedì|mercoledì|giovedì|venerdì|sabato)', r, re.I):
            out += ' ' + r
        else:
            out += '\n' + r
    return out


def main(pdf_path, out_path):
    righe = []
    precedente = None
    with pdfplumber.open(pdf_path) as pdf:
        for pagina in pdf.pages:
            prima_della_pagina = True
            for tabella in pagina.extract_tables():
                for riga in tabella:
                    celle = [c for c in riga]
                    # Le tabelle con colonne vuote di contorno (intestazione) hanno più celle: si salta l'intestazione
                    testo = ' '.join(c or '' for c in celle).upper()
                    if 'CORSO' in testo and 'LIVELLO' in testo:
                        continue
                    valori = [c for c in celle]
                    if len(valori) != len(COLONNE):
                        continue
                    if all((c or '').strip() == '' for c in valori):
                        continue
                    nuova = {}
                    for k, c in zip(COLONNE, valori):
                        if c is None or (prima_della_pagina and c.strip() == '' and k in ('corso', 'livello', 'docenti', 'aula', 'semestre')):
                            nuova[k] = precedente[k] if precedente else ''
                        else:
                            nuova[k] = pulisci(c)
                    # Giorno unito: vale anche per le fasce successive dello stesso corso
                    righe.append(nuova)
                    precedente = nuova
                    prima_della_pagina = False
    dati = {
        'tipo': 'lezioni',
        'titolo': 'Orario delle lezioni',
        'annoAccademico': '2025/2026',
        'sedi': 'Sede centrale: via Accademia Albertina 6, Torino\nEX INCET: via Francesco Cigna 96/17, Torino',
        'avvertenze': "Non è ancora completata l’attribuzione delle aule: alcuni spazi potrebbero cambiare, anche in sedi esterne all’Accademia.\nPotrebbero esserci ancora variazioni di orario per sovrapposizioni e nomine di nuovi docenti: seguite gli aggiornamenti.\nGli orari sono indicativi: fanno fede i calendari dei singoli docenti.",
        'righe': righe,
    }
    with open(out_path, 'w', encoding='utf-8') as f:
        json.dump(dati, f, ensure_ascii=False, indent=1)
    print(len(righe), 'righe')


if __name__ == '__main__':
    main(sys.argv[1], sys.argv[2])
