import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "drive_connessione" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"email" varchar,
  	"token_cifrato" varchar,
  	"collegato_il" timestamp(3) with time zone,
  	"collegato_da" varchar,
  	"cartella_media" varchar,
  	"cartella_radice" varchar,
  	"errore" varchar,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  ALTER TABLE "media" ADD COLUMN "drive_file_id" varchar;
  ALTER TABLE "media" ADD COLUMN "prefix" varchar DEFAULT '';
  ALTER TABLE "media" ADD COLUMN "_objectkey" varchar;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "drive_connessione" CASCADE;
  ALTER TABLE "media" DROP COLUMN "drive_file_id";
  ALTER TABLE "media" DROP COLUMN "prefix";
  ALTER TABLE "media" DROP COLUMN "_objectkey";`)
}
