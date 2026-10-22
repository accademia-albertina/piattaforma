import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_pagine_blocks_immagine_larghezza" AS ENUM('testo', 'piena');
  CREATE TYPE "public"."enum_pagine_blocks_link_voci_tipo" AS ENUM('interno', 'esterno');
  CREATE TYPE "public"."enum_pagine_uffici_editori" AS ENUM('segreteria', 'amministrativo', 'erasmus');
  CREATE TYPE "public"."enum_pagine_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__pagine_v_blocks_immagine_larghezza" AS ENUM('testo', 'piena');
  CREATE TYPE "public"."enum__pagine_v_blocks_link_voci_tipo" AS ENUM('interno', 'esterno');
  CREATE TYPE "public"."enum__pagine_v_version_uffici_editori" AS ENUM('segreteria', 'amministrativo', 'erasmus');
  CREATE TYPE "public"."enum__pagine_v_version_status" AS ENUM('draft', 'published');
  CREATE TABLE "pagine_blocks_testo" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"testo" jsonb,
  	"block_name" varchar
  );
  
  CREATE TABLE "pagine_blocks_immagine" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"immagine_id" integer,
  	"didascalia" varchar,
  	"larghezza" "enum_pagine_blocks_immagine_larghezza" DEFAULT 'testo',
  	"block_name" varchar
  );
  
  CREATE TABLE "pagine_blocks_galleria_immagini" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"immagine_id" integer,
  	"didascalia" varchar
  );
  
  CREATE TABLE "pagine_blocks_galleria" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"titolo" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "pagine_blocks_link_voci" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"etichetta" varchar,
  	"tipo" "enum_pagine_blocks_link_voci_tipo" DEFAULT 'interno',
  	"pagina_id" integer,
  	"url" varchar,
  	"descrizione" varchar
  );
  
  CREATE TABLE "pagine_blocks_link" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"titolo" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "pagine_blocks_fisarmonica_voci" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"titolo" varchar,
  	"testo" jsonb
  );
  
  CREATE TABLE "pagine_blocks_fisarmonica" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"titolo" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "pagine_blocks_contatti_voci" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"nome" varchar,
  	"ruolo" varchar,
  	"email" varchar,
  	"telefono" varchar,
  	"orari" varchar
  );
  
  CREATE TABLE "pagine_blocks_contatti" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"titolo" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "pagine_blocks_allegati_documenti" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"nome" varchar,
  	"file_id" integer
  );
  
  CREATE TABLE "pagine_blocks_allegati" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"titolo" varchar DEFAULT 'Allegati',
  	"block_name" varchar
  );
  
  CREATE TABLE "pagine_uffici_editori" (
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"value" "enum_pagine_uffici_editori",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "pagine" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"titolo" varchar,
  	"sommario" varchar,
  	"slug" varchar,
  	"genitore_id" integer,
  	"percorso" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_pagine_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "_pagine_v_blocks_testo" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"testo" jsonb,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pagine_v_blocks_immagine" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"immagine_id" integer,
  	"didascalia" varchar,
  	"larghezza" "enum__pagine_v_blocks_immagine_larghezza" DEFAULT 'testo',
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pagine_v_blocks_galleria_immagini" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"immagine_id" integer,
  	"didascalia" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_pagine_v_blocks_galleria" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"titolo" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pagine_v_blocks_link_voci" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"etichetta" varchar,
  	"tipo" "enum__pagine_v_blocks_link_voci_tipo" DEFAULT 'interno',
  	"pagina_id" integer,
  	"url" varchar,
  	"descrizione" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_pagine_v_blocks_link" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"titolo" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pagine_v_blocks_fisarmonica_voci" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"titolo" varchar,
  	"testo" jsonb,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_pagine_v_blocks_fisarmonica" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"titolo" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pagine_v_blocks_contatti_voci" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"nome" varchar,
  	"ruolo" varchar,
  	"email" varchar,
  	"telefono" varchar,
  	"orari" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_pagine_v_blocks_contatti" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"titolo" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pagine_v_blocks_allegati_documenti" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"nome" varchar,
  	"file_id" integer,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_pagine_v_blocks_allegati" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"titolo" varchar DEFAULT 'Allegati',
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pagine_v_version_uffici_editori" (
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"value" "enum__pagine_v_version_uffici_editori",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "_pagine_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_titolo" varchar,
  	"version_sommario" varchar,
  	"version_slug" varchar,
  	"version_genitore_id" integer,
  	"version_percorso" varchar,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__pagine_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean
  );
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "pagine_id" integer;
  ALTER TABLE "pagine_blocks_testo" ADD CONSTRAINT "pagine_blocks_testo_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pagine"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pagine_blocks_immagine" ADD CONSTRAINT "pagine_blocks_immagine_immagine_id_media_id_fk" FOREIGN KEY ("immagine_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pagine_blocks_immagine" ADD CONSTRAINT "pagine_blocks_immagine_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pagine"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pagine_blocks_galleria_immagini" ADD CONSTRAINT "pagine_blocks_galleria_immagini_immagine_id_media_id_fk" FOREIGN KEY ("immagine_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pagine_blocks_galleria_immagini" ADD CONSTRAINT "pagine_blocks_galleria_immagini_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pagine_blocks_galleria"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pagine_blocks_galleria" ADD CONSTRAINT "pagine_blocks_galleria_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pagine"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pagine_blocks_link_voci" ADD CONSTRAINT "pagine_blocks_link_voci_pagina_id_pagine_id_fk" FOREIGN KEY ("pagina_id") REFERENCES "public"."pagine"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pagine_blocks_link_voci" ADD CONSTRAINT "pagine_blocks_link_voci_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pagine_blocks_link"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pagine_blocks_link" ADD CONSTRAINT "pagine_blocks_link_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pagine"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pagine_blocks_fisarmonica_voci" ADD CONSTRAINT "pagine_blocks_fisarmonica_voci_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pagine_blocks_fisarmonica"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pagine_blocks_fisarmonica" ADD CONSTRAINT "pagine_blocks_fisarmonica_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pagine"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pagine_blocks_contatti_voci" ADD CONSTRAINT "pagine_blocks_contatti_voci_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pagine_blocks_contatti"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pagine_blocks_contatti" ADD CONSTRAINT "pagine_blocks_contatti_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pagine"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pagine_blocks_allegati_documenti" ADD CONSTRAINT "pagine_blocks_allegati_documenti_file_id_media_id_fk" FOREIGN KEY ("file_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pagine_blocks_allegati_documenti" ADD CONSTRAINT "pagine_blocks_allegati_documenti_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pagine_blocks_allegati"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pagine_blocks_allegati" ADD CONSTRAINT "pagine_blocks_allegati_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pagine"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pagine_uffici_editori" ADD CONSTRAINT "pagine_uffici_editori_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."pagine"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pagine" ADD CONSTRAINT "pagine_genitore_id_pagine_id_fk" FOREIGN KEY ("genitore_id") REFERENCES "public"."pagine"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pagine_v_blocks_testo" ADD CONSTRAINT "_pagine_v_blocks_testo_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pagine_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pagine_v_blocks_immagine" ADD CONSTRAINT "_pagine_v_blocks_immagine_immagine_id_media_id_fk" FOREIGN KEY ("immagine_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pagine_v_blocks_immagine" ADD CONSTRAINT "_pagine_v_blocks_immagine_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pagine_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pagine_v_blocks_galleria_immagini" ADD CONSTRAINT "_pagine_v_blocks_galleria_immagini_immagine_id_media_id_fk" FOREIGN KEY ("immagine_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pagine_v_blocks_galleria_immagini" ADD CONSTRAINT "_pagine_v_blocks_galleria_immagini_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pagine_v_blocks_galleria"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pagine_v_blocks_galleria" ADD CONSTRAINT "_pagine_v_blocks_galleria_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pagine_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pagine_v_blocks_link_voci" ADD CONSTRAINT "_pagine_v_blocks_link_voci_pagina_id_pagine_id_fk" FOREIGN KEY ("pagina_id") REFERENCES "public"."pagine"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pagine_v_blocks_link_voci" ADD CONSTRAINT "_pagine_v_blocks_link_voci_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pagine_v_blocks_link"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pagine_v_blocks_link" ADD CONSTRAINT "_pagine_v_blocks_link_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pagine_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pagine_v_blocks_fisarmonica_voci" ADD CONSTRAINT "_pagine_v_blocks_fisarmonica_voci_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pagine_v_blocks_fisarmonica"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pagine_v_blocks_fisarmonica" ADD CONSTRAINT "_pagine_v_blocks_fisarmonica_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pagine_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pagine_v_blocks_contatti_voci" ADD CONSTRAINT "_pagine_v_blocks_contatti_voci_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pagine_v_blocks_contatti"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pagine_v_blocks_contatti" ADD CONSTRAINT "_pagine_v_blocks_contatti_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pagine_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pagine_v_blocks_allegati_documenti" ADD CONSTRAINT "_pagine_v_blocks_allegati_documenti_file_id_media_id_fk" FOREIGN KEY ("file_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pagine_v_blocks_allegati_documenti" ADD CONSTRAINT "_pagine_v_blocks_allegati_documenti_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pagine_v_blocks_allegati"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pagine_v_blocks_allegati" ADD CONSTRAINT "_pagine_v_blocks_allegati_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pagine_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pagine_v_version_uffici_editori" ADD CONSTRAINT "_pagine_v_version_uffici_editori_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_pagine_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pagine_v" ADD CONSTRAINT "_pagine_v_parent_id_pagine_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."pagine"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pagine_v" ADD CONSTRAINT "_pagine_v_version_genitore_id_pagine_id_fk" FOREIGN KEY ("version_genitore_id") REFERENCES "public"."pagine"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "pagine_blocks_testo_order_idx" ON "pagine_blocks_testo" USING btree ("_order");
  CREATE INDEX "pagine_blocks_testo_parent_id_idx" ON "pagine_blocks_testo" USING btree ("_parent_id");
  CREATE INDEX "pagine_blocks_testo_path_idx" ON "pagine_blocks_testo" USING btree ("_path");
  CREATE INDEX "pagine_blocks_immagine_order_idx" ON "pagine_blocks_immagine" USING btree ("_order");
  CREATE INDEX "pagine_blocks_immagine_parent_id_idx" ON "pagine_blocks_immagine" USING btree ("_parent_id");
  CREATE INDEX "pagine_blocks_immagine_path_idx" ON "pagine_blocks_immagine" USING btree ("_path");
  CREATE INDEX "pagine_blocks_immagine_immagine_idx" ON "pagine_blocks_immagine" USING btree ("immagine_id");
  CREATE INDEX "pagine_blocks_galleria_immagini_order_idx" ON "pagine_blocks_galleria_immagini" USING btree ("_order");
  CREATE INDEX "pagine_blocks_galleria_immagini_parent_id_idx" ON "pagine_blocks_galleria_immagini" USING btree ("_parent_id");
  CREATE INDEX "pagine_blocks_galleria_immagini_immagine_idx" ON "pagine_blocks_galleria_immagini" USING btree ("immagine_id");
  CREATE INDEX "pagine_blocks_galleria_order_idx" ON "pagine_blocks_galleria" USING btree ("_order");
  CREATE INDEX "pagine_blocks_galleria_parent_id_idx" ON "pagine_blocks_galleria" USING btree ("_parent_id");
  CREATE INDEX "pagine_blocks_galleria_path_idx" ON "pagine_blocks_galleria" USING btree ("_path");
  CREATE INDEX "pagine_blocks_link_voci_order_idx" ON "pagine_blocks_link_voci" USING btree ("_order");
  CREATE INDEX "pagine_blocks_link_voci_parent_id_idx" ON "pagine_blocks_link_voci" USING btree ("_parent_id");
  CREATE INDEX "pagine_blocks_link_voci_pagina_idx" ON "pagine_blocks_link_voci" USING btree ("pagina_id");
  CREATE INDEX "pagine_blocks_link_order_idx" ON "pagine_blocks_link" USING btree ("_order");
  CREATE INDEX "pagine_blocks_link_parent_id_idx" ON "pagine_blocks_link" USING btree ("_parent_id");
  CREATE INDEX "pagine_blocks_link_path_idx" ON "pagine_blocks_link" USING btree ("_path");
  CREATE INDEX "pagine_blocks_fisarmonica_voci_order_idx" ON "pagine_blocks_fisarmonica_voci" USING btree ("_order");
  CREATE INDEX "pagine_blocks_fisarmonica_voci_parent_id_idx" ON "pagine_blocks_fisarmonica_voci" USING btree ("_parent_id");
  CREATE INDEX "pagine_blocks_fisarmonica_order_idx" ON "pagine_blocks_fisarmonica" USING btree ("_order");
  CREATE INDEX "pagine_blocks_fisarmonica_parent_id_idx" ON "pagine_blocks_fisarmonica" USING btree ("_parent_id");
  CREATE INDEX "pagine_blocks_fisarmonica_path_idx" ON "pagine_blocks_fisarmonica" USING btree ("_path");
  CREATE INDEX "pagine_blocks_contatti_voci_order_idx" ON "pagine_blocks_contatti_voci" USING btree ("_order");
  CREATE INDEX "pagine_blocks_contatti_voci_parent_id_idx" ON "pagine_blocks_contatti_voci" USING btree ("_parent_id");
  CREATE INDEX "pagine_blocks_contatti_order_idx" ON "pagine_blocks_contatti" USING btree ("_order");
  CREATE INDEX "pagine_blocks_contatti_parent_id_idx" ON "pagine_blocks_contatti" USING btree ("_parent_id");
  CREATE INDEX "pagine_blocks_contatti_path_idx" ON "pagine_blocks_contatti" USING btree ("_path");
  CREATE INDEX "pagine_blocks_allegati_documenti_order_idx" ON "pagine_blocks_allegati_documenti" USING btree ("_order");
  CREATE INDEX "pagine_blocks_allegati_documenti_parent_id_idx" ON "pagine_blocks_allegati_documenti" USING btree ("_parent_id");
  CREATE INDEX "pagine_blocks_allegati_documenti_file_idx" ON "pagine_blocks_allegati_documenti" USING btree ("file_id");
  CREATE INDEX "pagine_blocks_allegati_order_idx" ON "pagine_blocks_allegati" USING btree ("_order");
  CREATE INDEX "pagine_blocks_allegati_parent_id_idx" ON "pagine_blocks_allegati" USING btree ("_parent_id");
  CREATE INDEX "pagine_blocks_allegati_path_idx" ON "pagine_blocks_allegati" USING btree ("_path");
  CREATE INDEX "pagine_uffici_editori_order_idx" ON "pagine_uffici_editori" USING btree ("order");
  CREATE INDEX "pagine_uffici_editori_parent_idx" ON "pagine_uffici_editori" USING btree ("parent_id");
  CREATE UNIQUE INDEX "pagine_slug_idx" ON "pagine" USING btree ("slug");
  CREATE INDEX "pagine_genitore_idx" ON "pagine" USING btree ("genitore_id");
  CREATE INDEX "pagine_percorso_idx" ON "pagine" USING btree ("percorso");
  CREATE INDEX "pagine_updated_at_idx" ON "pagine" USING btree ("updated_at");
  CREATE INDEX "pagine_created_at_idx" ON "pagine" USING btree ("created_at");
  CREATE INDEX "pagine__status_idx" ON "pagine" USING btree ("_status");
  CREATE INDEX "_pagine_v_blocks_testo_order_idx" ON "_pagine_v_blocks_testo" USING btree ("_order");
  CREATE INDEX "_pagine_v_blocks_testo_parent_id_idx" ON "_pagine_v_blocks_testo" USING btree ("_parent_id");
  CREATE INDEX "_pagine_v_blocks_testo_path_idx" ON "_pagine_v_blocks_testo" USING btree ("_path");
  CREATE INDEX "_pagine_v_blocks_immagine_order_idx" ON "_pagine_v_blocks_immagine" USING btree ("_order");
  CREATE INDEX "_pagine_v_blocks_immagine_parent_id_idx" ON "_pagine_v_blocks_immagine" USING btree ("_parent_id");
  CREATE INDEX "_pagine_v_blocks_immagine_path_idx" ON "_pagine_v_blocks_immagine" USING btree ("_path");
  CREATE INDEX "_pagine_v_blocks_immagine_immagine_idx" ON "_pagine_v_blocks_immagine" USING btree ("immagine_id");
  CREATE INDEX "_pagine_v_blocks_galleria_immagini_order_idx" ON "_pagine_v_blocks_galleria_immagini" USING btree ("_order");
  CREATE INDEX "_pagine_v_blocks_galleria_immagini_parent_id_idx" ON "_pagine_v_blocks_galleria_immagini" USING btree ("_parent_id");
  CREATE INDEX "_pagine_v_blocks_galleria_immagini_immagine_idx" ON "_pagine_v_blocks_galleria_immagini" USING btree ("immagine_id");
  CREATE INDEX "_pagine_v_blocks_galleria_order_idx" ON "_pagine_v_blocks_galleria" USING btree ("_order");
  CREATE INDEX "_pagine_v_blocks_galleria_parent_id_idx" ON "_pagine_v_blocks_galleria" USING btree ("_parent_id");
  CREATE INDEX "_pagine_v_blocks_galleria_path_idx" ON "_pagine_v_blocks_galleria" USING btree ("_path");
  CREATE INDEX "_pagine_v_blocks_link_voci_order_idx" ON "_pagine_v_blocks_link_voci" USING btree ("_order");
  CREATE INDEX "_pagine_v_blocks_link_voci_parent_id_idx" ON "_pagine_v_blocks_link_voci" USING btree ("_parent_id");
  CREATE INDEX "_pagine_v_blocks_link_voci_pagina_idx" ON "_pagine_v_blocks_link_voci" USING btree ("pagina_id");
  CREATE INDEX "_pagine_v_blocks_link_order_idx" ON "_pagine_v_blocks_link" USING btree ("_order");
  CREATE INDEX "_pagine_v_blocks_link_parent_id_idx" ON "_pagine_v_blocks_link" USING btree ("_parent_id");
  CREATE INDEX "_pagine_v_blocks_link_path_idx" ON "_pagine_v_blocks_link" USING btree ("_path");
  CREATE INDEX "_pagine_v_blocks_fisarmonica_voci_order_idx" ON "_pagine_v_blocks_fisarmonica_voci" USING btree ("_order");
  CREATE INDEX "_pagine_v_blocks_fisarmonica_voci_parent_id_idx" ON "_pagine_v_blocks_fisarmonica_voci" USING btree ("_parent_id");
  CREATE INDEX "_pagine_v_blocks_fisarmonica_order_idx" ON "_pagine_v_blocks_fisarmonica" USING btree ("_order");
  CREATE INDEX "_pagine_v_blocks_fisarmonica_parent_id_idx" ON "_pagine_v_blocks_fisarmonica" USING btree ("_parent_id");
  CREATE INDEX "_pagine_v_blocks_fisarmonica_path_idx" ON "_pagine_v_blocks_fisarmonica" USING btree ("_path");
  CREATE INDEX "_pagine_v_blocks_contatti_voci_order_idx" ON "_pagine_v_blocks_contatti_voci" USING btree ("_order");
  CREATE INDEX "_pagine_v_blocks_contatti_voci_parent_id_idx" ON "_pagine_v_blocks_contatti_voci" USING btree ("_parent_id");
  CREATE INDEX "_pagine_v_blocks_contatti_order_idx" ON "_pagine_v_blocks_contatti" USING btree ("_order");
  CREATE INDEX "_pagine_v_blocks_contatti_parent_id_idx" ON "_pagine_v_blocks_contatti" USING btree ("_parent_id");
  CREATE INDEX "_pagine_v_blocks_contatti_path_idx" ON "_pagine_v_blocks_contatti" USING btree ("_path");
  CREATE INDEX "_pagine_v_blocks_allegati_documenti_order_idx" ON "_pagine_v_blocks_allegati_documenti" USING btree ("_order");
  CREATE INDEX "_pagine_v_blocks_allegati_documenti_parent_id_idx" ON "_pagine_v_blocks_allegati_documenti" USING btree ("_parent_id");
  CREATE INDEX "_pagine_v_blocks_allegati_documenti_file_idx" ON "_pagine_v_blocks_allegati_documenti" USING btree ("file_id");
  CREATE INDEX "_pagine_v_blocks_allegati_order_idx" ON "_pagine_v_blocks_allegati" USING btree ("_order");
  CREATE INDEX "_pagine_v_blocks_allegati_parent_id_idx" ON "_pagine_v_blocks_allegati" USING btree ("_parent_id");
  CREATE INDEX "_pagine_v_blocks_allegati_path_idx" ON "_pagine_v_blocks_allegati" USING btree ("_path");
  CREATE INDEX "_pagine_v_version_uffici_editori_order_idx" ON "_pagine_v_version_uffici_editori" USING btree ("order");
  CREATE INDEX "_pagine_v_version_uffici_editori_parent_idx" ON "_pagine_v_version_uffici_editori" USING btree ("parent_id");
  CREATE INDEX "_pagine_v_parent_idx" ON "_pagine_v" USING btree ("parent_id");
  CREATE INDEX "_pagine_v_version_version_slug_idx" ON "_pagine_v" USING btree ("version_slug");
  CREATE INDEX "_pagine_v_version_version_genitore_idx" ON "_pagine_v" USING btree ("version_genitore_id");
  CREATE INDEX "_pagine_v_version_version_percorso_idx" ON "_pagine_v" USING btree ("version_percorso");
  CREATE INDEX "_pagine_v_version_version_updated_at_idx" ON "_pagine_v" USING btree ("version_updated_at");
  CREATE INDEX "_pagine_v_version_version_created_at_idx" ON "_pagine_v" USING btree ("version_created_at");
  CREATE INDEX "_pagine_v_version_version__status_idx" ON "_pagine_v" USING btree ("version__status");
  CREATE INDEX "_pagine_v_created_at_idx" ON "_pagine_v" USING btree ("created_at");
  CREATE INDEX "_pagine_v_updated_at_idx" ON "_pagine_v" USING btree ("updated_at");
  CREATE INDEX "_pagine_v_latest_idx" ON "_pagine_v" USING btree ("latest");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_pagine_fk" FOREIGN KEY ("pagine_id") REFERENCES "public"."pagine"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_pagine_id_idx" ON "payload_locked_documents_rels" USING btree ("pagine_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "pagine_blocks_testo" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pagine_blocks_immagine" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pagine_blocks_galleria_immagini" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pagine_blocks_galleria" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pagine_blocks_link_voci" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pagine_blocks_link" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pagine_blocks_fisarmonica_voci" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pagine_blocks_fisarmonica" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pagine_blocks_contatti_voci" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pagine_blocks_contatti" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pagine_blocks_allegati_documenti" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pagine_blocks_allegati" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pagine_uffici_editori" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pagine" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pagine_v_blocks_testo" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pagine_v_blocks_immagine" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pagine_v_blocks_galleria_immagini" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pagine_v_blocks_galleria" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pagine_v_blocks_link_voci" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pagine_v_blocks_link" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pagine_v_blocks_fisarmonica_voci" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pagine_v_blocks_fisarmonica" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pagine_v_blocks_contatti_voci" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pagine_v_blocks_contatti" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pagine_v_blocks_allegati_documenti" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pagine_v_blocks_allegati" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pagine_v_version_uffici_editori" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pagine_v" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "pagine_blocks_testo" CASCADE;
  DROP TABLE "pagine_blocks_immagine" CASCADE;
  DROP TABLE "pagine_blocks_galleria_immagini" CASCADE;
  DROP TABLE "pagine_blocks_galleria" CASCADE;
  DROP TABLE "pagine_blocks_link_voci" CASCADE;
  DROP TABLE "pagine_blocks_link" CASCADE;
  DROP TABLE "pagine_blocks_fisarmonica_voci" CASCADE;
  DROP TABLE "pagine_blocks_fisarmonica" CASCADE;
  DROP TABLE "pagine_blocks_contatti_voci" CASCADE;
  DROP TABLE "pagine_blocks_contatti" CASCADE;
  DROP TABLE "pagine_blocks_allegati_documenti" CASCADE;
  DROP TABLE "pagine_blocks_allegati" CASCADE;
  DROP TABLE "pagine_uffici_editori" CASCADE;
  DROP TABLE "pagine" CASCADE;
  DROP TABLE "_pagine_v_blocks_testo" CASCADE;
  DROP TABLE "_pagine_v_blocks_immagine" CASCADE;
  DROP TABLE "_pagine_v_blocks_galleria_immagini" CASCADE;
  DROP TABLE "_pagine_v_blocks_galleria" CASCADE;
  DROP TABLE "_pagine_v_blocks_link_voci" CASCADE;
  DROP TABLE "_pagine_v_blocks_link" CASCADE;
  DROP TABLE "_pagine_v_blocks_fisarmonica_voci" CASCADE;
  DROP TABLE "_pagine_v_blocks_fisarmonica" CASCADE;
  DROP TABLE "_pagine_v_blocks_contatti_voci" CASCADE;
  DROP TABLE "_pagine_v_blocks_contatti" CASCADE;
  DROP TABLE "_pagine_v_blocks_allegati_documenti" CASCADE;
  DROP TABLE "_pagine_v_blocks_allegati" CASCADE;
  DROP TABLE "_pagine_v_version_uffici_editori" CASCADE;
  DROP TABLE "_pagine_v" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_pagine_fk";
  
  DROP INDEX "payload_locked_documents_rels_pagine_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "pagine_id";
  DROP TYPE "public"."enum_pagine_blocks_immagine_larghezza";
  DROP TYPE "public"."enum_pagine_blocks_link_voci_tipo";
  DROP TYPE "public"."enum_pagine_uffici_editori";
  DROP TYPE "public"."enum_pagine_status";
  DROP TYPE "public"."enum__pagine_v_blocks_immagine_larghezza";
  DROP TYPE "public"."enum__pagine_v_blocks_link_voci_tipo";
  DROP TYPE "public"."enum__pagine_v_version_uffici_editori";
  DROP TYPE "public"."enum__pagine_v_version_status";`)
}
