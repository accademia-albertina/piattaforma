import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TYPE "public"."enum_avvisi_categorie" ADD VALUE 'ammissioni';
  ALTER TYPE "public"."enum__avvisi_v_version_categorie" ADD VALUE 'ammissioni';
  CREATE TABLE "pagine_blocks_avvisi_ammissioni" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"titolo" varchar DEFAULT 'Avvisi dei coordinatori',
  	"block_name" varchar
  );
  
  CREATE TABLE "_pagine_v_blocks_avvisi_ammissioni" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"titolo" varchar DEFAULT 'Avvisi dei coordinatori',
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  ALTER TABLE "avvisi" ADD COLUMN "visibile_fino_al" timestamp(3) with time zone;
  ALTER TABLE "_avvisi_v" ADD COLUMN "version_visibile_fino_al" timestamp(3) with time zone;
  ALTER TABLE "pagine_blocks_avvisi_ammissioni" ADD CONSTRAINT "pagine_blocks_avvisi_ammissioni_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pagine"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pagine_v_blocks_avvisi_ammissioni" ADD CONSTRAINT "_pagine_v_blocks_avvisi_ammissioni_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pagine_v"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "pagine_blocks_avvisi_ammissioni_order_idx" ON "pagine_blocks_avvisi_ammissioni" USING btree ("_order");
  CREATE INDEX "pagine_blocks_avvisi_ammissioni_parent_id_idx" ON "pagine_blocks_avvisi_ammissioni" USING btree ("_parent_id");
  CREATE INDEX "pagine_blocks_avvisi_ammissioni_path_idx" ON "pagine_blocks_avvisi_ammissioni" USING btree ("_path");
  CREATE INDEX "_pagine_v_blocks_avvisi_ammissioni_order_idx" ON "_pagine_v_blocks_avvisi_ammissioni" USING btree ("_order");
  CREATE INDEX "_pagine_v_blocks_avvisi_ammissioni_parent_id_idx" ON "_pagine_v_blocks_avvisi_ammissioni" USING btree ("_parent_id");
  CREATE INDEX "_pagine_v_blocks_avvisi_ammissioni_path_idx" ON "_pagine_v_blocks_avvisi_ammissioni" USING btree ("_path");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "pagine_blocks_avvisi_ammissioni" CASCADE;
  DROP TABLE "_pagine_v_blocks_avvisi_ammissioni" CASCADE;
  ALTER TABLE "avvisi_categorie" ALTER COLUMN "value" SET DATA TYPE text;
  DROP TYPE "public"."enum_avvisi_categorie";
  CREATE TYPE "public"."enum_avvisi_categorie" AS ENUM('in-evidenza', 'generali', 'lezioni', 'esami', 'eventi', 'bandi-e-concorsi', 'iscrizioni', 'coordinatori', 'tasse', 'biblioteca');
  ALTER TABLE "avvisi_categorie" ALTER COLUMN "value" SET DATA TYPE "public"."enum_avvisi_categorie" USING "value"::"public"."enum_avvisi_categorie";
  ALTER TABLE "_avvisi_v_version_categorie" ALTER COLUMN "value" SET DATA TYPE text;
  DROP TYPE "public"."enum__avvisi_v_version_categorie";
  CREATE TYPE "public"."enum__avvisi_v_version_categorie" AS ENUM('in-evidenza', 'generali', 'lezioni', 'esami', 'eventi', 'bandi-e-concorsi', 'iscrizioni', 'coordinatori', 'tasse', 'biblioteca');
  ALTER TABLE "_avvisi_v_version_categorie" ALTER COLUMN "value" SET DATA TYPE "public"."enum__avvisi_v_version_categorie" USING "value"::"public"."enum__avvisi_v_version_categorie";
  ALTER TABLE "avvisi" DROP COLUMN "visibile_fino_al";
  ALTER TABLE "_avvisi_v" DROP COLUMN "version_visibile_fino_al";`)
}
