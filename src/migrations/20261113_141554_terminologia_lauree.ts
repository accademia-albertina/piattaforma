import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

import { aggiornaTerminologia, aggiornaTerminologiaLexical } from '@/lib/terminologia'

/**
 * DL PA agosto 2026: nei testi delle schede Triennio/Biennio delle scuole «Diploma accademico di
 * primo/secondo livello» diventa «Laurea» / «Laurea magistrale». Solo dati, nessuno schema.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  for (const livello of ['triennio', 'biennio'] as const) {
    const tabella = sql.identifier(`scuole_${livello}_sezioni`)
    const { rows } = await db.execute(sql`SELECT id, titolo, testo FROM ${tabella}`)
    for (const r of rows as { id: string; titolo: string | null; testo: unknown }[]) {
      const titolo = r.titolo ? aggiornaTerminologia(r.titolo, livello) : r.titolo
      const testo = r.testo ? aggiornaTerminologiaLexical(r.testo, livello) : r.testo
      if (titolo === r.titolo && JSON.stringify(testo) === JSON.stringify(r.testo)) continue
      await db.execute(
        sql`UPDATE ${tabella} SET titolo = ${titolo}, testo = ${JSON.stringify(testo)}::jsonb WHERE id = ${r.id}`,
      )
    }
  }
}

export async function down(_: MigrateDownArgs): Promise<void> {
  // Le sostituzioni non si possono annullare in modo affidabile: i testi restano aggiornati.
}
