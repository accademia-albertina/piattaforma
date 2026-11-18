import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_pagine_blocks_galleria_aspetto" AS ENUM('griglia', 'fascia');
  CREATE TYPE "public"."enum__pagine_v_blocks_galleria_aspetto" AS ENUM('griglia', 'fascia');
  CREATE TABLE "pagine_blocks_mappa" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"indirizzo" varchar DEFAULT 'Via Accademia Albertina 6, 10123 Torino',
  	"nome" varchar DEFAULT 'Accademia Albertina di Belle Arti',
  	"block_name" varchar
  );
  
  CREATE TABLE "_pagine_v_blocks_mappa" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"indirizzo" varchar DEFAULT 'Via Accademia Albertina 6, 10123 Torino',
  	"nome" varchar DEFAULT 'Accademia Albertina di Belle Arti',
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  ALTER TABLE "pagine_blocks_galleria" ADD COLUMN "aspetto" "enum_pagine_blocks_galleria_aspetto" DEFAULT 'griglia';
  ALTER TABLE "_pagine_v_blocks_galleria" ADD COLUMN "aspetto" "enum__pagine_v_blocks_galleria_aspetto" DEFAULT 'griglia';
  ALTER TABLE "pagine_blocks_mappa" ADD CONSTRAINT "pagine_blocks_mappa_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pagine"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pagine_v_blocks_mappa" ADD CONSTRAINT "_pagine_v_blocks_mappa_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pagine_v"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "pagine_blocks_mappa_order_idx" ON "pagine_blocks_mappa" USING btree ("_order");
  CREATE INDEX "pagine_blocks_mappa_parent_id_idx" ON "pagine_blocks_mappa" USING btree ("_parent_id");
  CREATE INDEX "pagine_blocks_mappa_path_idx" ON "pagine_blocks_mappa" USING btree ("_path");
  CREATE INDEX "_pagine_v_blocks_mappa_order_idx" ON "_pagine_v_blocks_mappa" USING btree ("_order");
  CREATE INDEX "_pagine_v_blocks_mappa_parent_id_idx" ON "_pagine_v_blocks_mappa" USING btree ("_parent_id");
  CREATE INDEX "_pagine_v_blocks_mappa_path_idx" ON "_pagine_v_blocks_mappa" USING btree ("_path");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "pagine_blocks_mappa" CASCADE;
  DROP TABLE "_pagine_v_blocks_mappa" CASCADE;
  ALTER TABLE "pagine_blocks_galleria" DROP COLUMN "aspetto";
  ALTER TABLE "_pagine_v_blocks_galleria" DROP COLUMN "aspetto";
  DROP TYPE "public"."enum_pagine_blocks_galleria_aspetto";
  DROP TYPE "public"."enum__pagine_v_blocks_galleria_aspetto";`)
}
