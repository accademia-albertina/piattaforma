import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "avvisi" ADD COLUMN "immagine_id" integer;
  ALTER TABLE "_avvisi_v" ADD COLUMN "version_immagine_id" integer;
  ALTER TABLE "avvisi" ADD CONSTRAINT "avvisi_immagine_id_media_id_fk" FOREIGN KEY ("immagine_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_avvisi_v" ADD CONSTRAINT "_avvisi_v_version_immagine_id_media_id_fk" FOREIGN KEY ("version_immagine_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "avvisi_immagine_idx" ON "avvisi" USING btree ("immagine_id");
  CREATE INDEX "_avvisi_v_version_version_immagine_idx" ON "_avvisi_v" USING btree ("version_immagine_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "avvisi" DROP CONSTRAINT "avvisi_immagine_id_media_id_fk";
  
  ALTER TABLE "_avvisi_v" DROP CONSTRAINT "_avvisi_v_version_immagine_id_media_id_fk";
  
  DROP INDEX "avvisi_immagine_idx";
  DROP INDEX "_avvisi_v_version_version_immagine_idx";
  ALTER TABLE "avvisi" DROP COLUMN "immagine_id";
  ALTER TABLE "_avvisi_v" DROP COLUMN "version_immagine_id";`)
}
