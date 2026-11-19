import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "home" ALTER COLUMN "accessi_testo" SET DEFAULT 'Accademia Albertina di Belle Arti di Torino: Lauree e Lauree Magistrali in arti visive, progettazione e nuove tecnologie.';
  ALTER TABLE "home" ALTER COLUMN "scuole_titolo" SET DEFAULT 'Laurea e Laurea Magistrale';
  ALTER TABLE "home" ALTER COLUMN "scuole_testo" SET DEFAULT 'Lauree e Lauree Magistrali con lo stesso valore di quelle universitarie.';
  ALTER TABLE "users" ADD COLUMN "account_di_prova" boolean DEFAULT false;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "home" ALTER COLUMN "accessi_testo" SET DEFAULT 'Accademia Albertina di Belle Arti di Torino: Lauree e Lauree magistrali in arti visive, progettazione e nuove tecnologie.';
  ALTER TABLE "home" ALTER COLUMN "scuole_titolo" SET DEFAULT 'Laurea e Laurea magistrale';
  ALTER TABLE "home" ALTER COLUMN "scuole_testo" SET DEFAULT 'Lauree e Lauree magistrali con lo stesso valore di quelle universitarie.';
  ALTER TABLE "users" DROP COLUMN "account_di_prova";`)
}
