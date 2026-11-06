import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "media" ADD COLUMN "creato_da_id" integer;
  ALTER TABLE "media" ADD CONSTRAINT "media_creato_da_id_users_id_fk" FOREIGN KEY ("creato_da_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "media_creato_da_idx" ON "media" USING btree ("creato_da_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "media" DROP CONSTRAINT "media_creato_da_id_users_id_fk";
  
  DROP INDEX "media_creato_da_idx";
  ALTER TABLE "media" DROP COLUMN "creato_da_id";`)
}
