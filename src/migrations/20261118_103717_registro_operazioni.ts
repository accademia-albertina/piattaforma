import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TYPE "public"."enum_registro_attivita_azione" ADD VALUE 'avviato';
  ALTER TYPE "public"."enum_registro_attivita_azione" ADD VALUE 'concluso';
  ALTER TYPE "public"."enum_registro_attivita_azione" ADD VALUE 'fermato';
  ALTER TYPE "public"."enum_registro_attivita_azione" ADD VALUE 'collegato';
  ALTER TYPE "public"."enum_registro_attivita_azione" ADD VALUE 'scollegato';
  ALTER TABLE "registro_attivita" ADD COLUMN "dettagli" varchar;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "registro_attivita" ALTER COLUMN "azione" SET DATA TYPE text;
  DROP TYPE "public"."enum_registro_attivita_azione";
  CREATE TYPE "public"."enum_registro_attivita_azione" AS ENUM('creato', 'modificato', 'pubblicato', 'ritirato', 'eliminato');
  ALTER TABLE "registro_attivita" ALTER COLUMN "azione" SET DATA TYPE "public"."enum_registro_attivita_azione" USING "azione"::"public"."enum_registro_attivita_azione";
  ALTER TABLE "registro_attivita" DROP COLUMN "dettagli";`)
}
