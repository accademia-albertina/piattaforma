import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "pagine_blocks_documento" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"nome" varchar,
  	"descrizione" varchar,
  	"file_id" integer,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pagine_v_blocks_documento" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"nome" varchar,
  	"descrizione" varchar,
  	"file_id" integer,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  ALTER TABLE "pagine" ADD COLUMN "wp_id" varchar;
  ALTER TABLE "pagine" ADD COLUMN "wp_modificato" varchar;
  ALTER TABLE "pagine" ADD COLUMN "wp_impronta" varchar;
  ALTER TABLE "pagine" ADD COLUMN "modificato_nel_pannello" boolean DEFAULT false;
  ALTER TABLE "_pagine_v" ADD COLUMN "version_wp_id" varchar;
  ALTER TABLE "_pagine_v" ADD COLUMN "version_wp_modificato" varchar;
  ALTER TABLE "_pagine_v" ADD COLUMN "version_wp_impronta" varchar;
  ALTER TABLE "_pagine_v" ADD COLUMN "version_modificato_nel_pannello" boolean DEFAULT false;
  ALTER TABLE "pagine_blocks_documento" ADD CONSTRAINT "pagine_blocks_documento_file_id_media_id_fk" FOREIGN KEY ("file_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pagine_blocks_documento" ADD CONSTRAINT "pagine_blocks_documento_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pagine"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pagine_v_blocks_documento" ADD CONSTRAINT "_pagine_v_blocks_documento_file_id_media_id_fk" FOREIGN KEY ("file_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pagine_v_blocks_documento" ADD CONSTRAINT "_pagine_v_blocks_documento_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pagine_v"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "pagine_blocks_documento_order_idx" ON "pagine_blocks_documento" USING btree ("_order");
  CREATE INDEX "pagine_blocks_documento_parent_id_idx" ON "pagine_blocks_documento" USING btree ("_parent_id");
  CREATE INDEX "pagine_blocks_documento_path_idx" ON "pagine_blocks_documento" USING btree ("_path");
  CREATE INDEX "pagine_blocks_documento_file_idx" ON "pagine_blocks_documento" USING btree ("file_id");
  CREATE INDEX "_pagine_v_blocks_documento_order_idx" ON "_pagine_v_blocks_documento" USING btree ("_order");
  CREATE INDEX "_pagine_v_blocks_documento_parent_id_idx" ON "_pagine_v_blocks_documento" USING btree ("_parent_id");
  CREATE INDEX "_pagine_v_blocks_documento_path_idx" ON "_pagine_v_blocks_documento" USING btree ("_path");
  CREATE INDEX "_pagine_v_blocks_documento_file_idx" ON "_pagine_v_blocks_documento" USING btree ("file_id");
  CREATE UNIQUE INDEX "pagine_wp_id_idx" ON "pagine" USING btree ("wp_id");
  CREATE INDEX "_pagine_v_version_version_wp_id_idx" ON "_pagine_v" USING btree ("version_wp_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "pagine_blocks_documento" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pagine_v_blocks_documento" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "pagine_blocks_documento" CASCADE;
  DROP TABLE "_pagine_v_blocks_documento" CASCADE;
  DROP INDEX "pagine_wp_id_idx";
  DROP INDEX "_pagine_v_version_version_wp_id_idx";
  ALTER TABLE "pagine" DROP COLUMN "wp_id";
  ALTER TABLE "pagine" DROP COLUMN "wp_modificato";
  ALTER TABLE "pagine" DROP COLUMN "wp_impronta";
  ALTER TABLE "pagine" DROP COLUMN "modificato_nel_pannello";
  ALTER TABLE "_pagine_v" DROP COLUMN "version_wp_id";
  ALTER TABLE "_pagine_v" DROP COLUMN "version_wp_modificato";
  ALTER TABLE "_pagine_v" DROP COLUMN "version_wp_impronta";
  ALTER TABLE "_pagine_v" DROP COLUMN "version_modificato_nel_pannello";`)
}
