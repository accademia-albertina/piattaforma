import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * Terminologia: dal DL PA di agosto 2026 i diplomi accademici di primo e secondo livello
 * si chiamano "Laurea" e "Laurea magistrale". Aggiorna i testi delle schede Triennio/Biennio
 * delle scuole. Le pagine istituzionali non si toccano: citano regolamenti e decreti.
 */
const P = '[Dd]iploma( [Aa]ccademico)? di ([Pp]rimo|I) [Ll]ivello'
const S = '[Dd]iploma( [Aa]ccademico)? di ([Ss]econdo|II) [Ll]ivello'

/** Sostituzioni in ordine: prima i casi con preposizione o articolo, poi il resto. */
export const SOSTITUZIONI: [string, string][] = [
  [`Corso di ${S}`, 'Corso di Laurea magistrale'],
  [`([Dd])el ${S}`, '\\1ella Laurea magistrale'],
  [`([Dd])el ${P}`, '\\1ella Laurea'],
  [`Il ${S}`, 'La Laurea magistrale'],
  [`il ${S}`, 'la Laurea magistrale'],
  [`Il ${P}`, 'La Laurea'],
  [`il ${P}`, 'la Laurea'],
  [S, 'Laurea magistrale'],
  [P, 'Laurea'],
  ['Laurea magistrale viene conseguito', 'Laurea magistrale viene conseguita'],
]

const TABELLE = ['scuole_triennio_sezioni', 'scuole_biennio_sezioni']

export async function up({ db }: MigrateUpArgs): Promise<void> {
  for (const tabella of TABELLE) {
    for (const [da, a] of SOSTITUZIONI) {
      await db.execute(
        sql.raw(
          `UPDATE "${tabella}" SET "testo" = regexp_replace("testo"::text, '${da}', '${a}', 'g')::jsonb WHERE "testo"::text ~ '${da}';`,
        ),
      )
    }
  }
}

export async function down(_args: MigrateDownArgs): Promise<void> {
  // Sostituzione di testo: non si torna indietro in automatico.
}
