import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_scuole_dipartimento" AS ENUM('arti-visive', 'arti-della-progettazione', 'arti-tecnologiche', 'comunicazione-e-didattica');
  ALTER TABLE "scuole" ADD COLUMN "dipartimento" "enum_scuole_dipartimento";
  ALTER TABLE "scuole" ADD COLUMN "immagine_id" integer;
  ALTER TABLE "scuole" ADD CONSTRAINT "scuole_immagine_id_media_id_fk" FOREIGN KEY ("immagine_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "scuole_immagine_idx" ON "scuole" USING btree ("immagine_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "scuole" DROP CONSTRAINT "scuole_immagine_id_media_id_fk";
  
  DROP INDEX "scuole_immagine_idx";
  ALTER TABLE "scuole" DROP COLUMN "dipartimento";
  ALTER TABLE "scuole" DROP COLUMN "immagine_id";
  DROP TYPE "public"."enum_scuole_dipartimento";`)
}
