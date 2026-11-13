import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "media" ADD COLUMN "wp_id" numeric;
  ALTER TABLE "media" ADD COLUMN "wp_url" varchar;
  ALTER TABLE "media" ADD COLUMN "wp_modificato" varchar;
  CREATE UNIQUE INDEX "media_wp_id_idx" ON "media" USING btree ("wp_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP INDEX "media_wp_id_idx";
  ALTER TABLE "media" DROP COLUMN "wp_id";
  ALTER TABLE "media" DROP COLUMN "wp_url";
  ALTER TABLE "media" DROP COLUMN "wp_modificato";`)
}
