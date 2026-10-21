import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_avvisi_categorie" AS ENUM('in-evidenza', 'generali', 'lezioni', 'esami', 'eventi', 'bandi-e-concorsi', 'iscrizioni', 'coordinatori', 'tasse');
  CREATE TYPE "public"."enum_avvisi_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__avvisi_v_version_categorie" AS ENUM('in-evidenza', 'generali', 'lezioni', 'esami', 'eventi', 'bandi-e-concorsi', 'iscrizioni', 'coordinatori', 'tasse');
  CREATE TYPE "public"."enum__avvisi_v_version_status" AS ENUM('draft', 'published');
  CREATE TABLE "avvisi_categorie" (
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"value" "enum_avvisi_categorie",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "avvisi_allegati" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"nome" varchar,
  	"file_id" integer
  );
  
  CREATE TABLE "avvisi" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"titolo" varchar,
  	"sommario" varchar,
  	"pubblicato_il" timestamp(3) with time zone,
  	"contenuto" jsonb,
  	"slug" varchar,
  	"autore_id" integer,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_avvisi_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "avvisi_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"scuole_id" integer
  );
  
  CREATE TABLE "_avvisi_v_version_categorie" (
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"value" "enum__avvisi_v_version_categorie",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "_avvisi_v_version_allegati" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"nome" varchar,
  	"file_id" integer,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_avvisi_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_titolo" varchar,
  	"version_sommario" varchar,
  	"version_pubblicato_il" timestamp(3) with time zone,
  	"version_contenuto" jsonb,
  	"version_slug" varchar,
  	"version_autore_id" integer,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__avvisi_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean
  );
  
  CREATE TABLE "_avvisi_v_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"scuole_id" integer
  );
  
  CREATE TABLE "scuole" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"nome" varchar NOT NULL,
  	"sigla" varchar,
  	"descrizione" varchar,
  	"slug" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "avvisi_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "scuole_id" integer;
  ALTER TABLE "avvisi_categorie" ADD CONSTRAINT "avvisi_categorie_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."avvisi"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "avvisi_allegati" ADD CONSTRAINT "avvisi_allegati_file_id_media_id_fk" FOREIGN KEY ("file_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "avvisi_allegati" ADD CONSTRAINT "avvisi_allegati_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."avvisi"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "avvisi" ADD CONSTRAINT "avvisi_autore_id_users_id_fk" FOREIGN KEY ("autore_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "avvisi_rels" ADD CONSTRAINT "avvisi_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."avvisi"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "avvisi_rels" ADD CONSTRAINT "avvisi_rels_scuole_fk" FOREIGN KEY ("scuole_id") REFERENCES "public"."scuole"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_avvisi_v_version_categorie" ADD CONSTRAINT "_avvisi_v_version_categorie_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_avvisi_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_avvisi_v_version_allegati" ADD CONSTRAINT "_avvisi_v_version_allegati_file_id_media_id_fk" FOREIGN KEY ("file_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_avvisi_v_version_allegati" ADD CONSTRAINT "_avvisi_v_version_allegati_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_avvisi_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_avvisi_v" ADD CONSTRAINT "_avvisi_v_parent_id_avvisi_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."avvisi"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_avvisi_v" ADD CONSTRAINT "_avvisi_v_version_autore_id_users_id_fk" FOREIGN KEY ("version_autore_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_avvisi_v_rels" ADD CONSTRAINT "_avvisi_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_avvisi_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_avvisi_v_rels" ADD CONSTRAINT "_avvisi_v_rels_scuole_fk" FOREIGN KEY ("scuole_id") REFERENCES "public"."scuole"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "avvisi_categorie_order_idx" ON "avvisi_categorie" USING btree ("order");
  CREATE INDEX "avvisi_categorie_parent_idx" ON "avvisi_categorie" USING btree ("parent_id");
  CREATE INDEX "avvisi_categorie_value_idx" ON "avvisi_categorie" USING btree ("value");
  CREATE INDEX "avvisi_allegati_order_idx" ON "avvisi_allegati" USING btree ("_order");
  CREATE INDEX "avvisi_allegati_parent_id_idx" ON "avvisi_allegati" USING btree ("_parent_id");
  CREATE INDEX "avvisi_allegati_file_idx" ON "avvisi_allegati" USING btree ("file_id");
  CREATE INDEX "avvisi_pubblicato_il_idx" ON "avvisi" USING btree ("pubblicato_il");
  CREATE UNIQUE INDEX "avvisi_slug_idx" ON "avvisi" USING btree ("slug");
  CREATE INDEX "avvisi_autore_idx" ON "avvisi" USING btree ("autore_id");
  CREATE INDEX "avvisi_updated_at_idx" ON "avvisi" USING btree ("updated_at");
  CREATE INDEX "avvisi_created_at_idx" ON "avvisi" USING btree ("created_at");
  CREATE INDEX "avvisi__status_idx" ON "avvisi" USING btree ("_status");
  CREATE INDEX "avvisi_rels_order_idx" ON "avvisi_rels" USING btree ("order");
  CREATE INDEX "avvisi_rels_parent_idx" ON "avvisi_rels" USING btree ("parent_id");
  CREATE INDEX "avvisi_rels_path_idx" ON "avvisi_rels" USING btree ("path");
  CREATE INDEX "avvisi_rels_scuole_id_idx" ON "avvisi_rels" USING btree ("scuole_id");
  CREATE INDEX "_avvisi_v_version_categorie_order_idx" ON "_avvisi_v_version_categorie" USING btree ("order");
  CREATE INDEX "_avvisi_v_version_categorie_parent_idx" ON "_avvisi_v_version_categorie" USING btree ("parent_id");
  CREATE INDEX "_avvisi_v_version_categorie_value_idx" ON "_avvisi_v_version_categorie" USING btree ("value");
  CREATE INDEX "_avvisi_v_version_allegati_order_idx" ON "_avvisi_v_version_allegati" USING btree ("_order");
  CREATE INDEX "_avvisi_v_version_allegati_parent_id_idx" ON "_avvisi_v_version_allegati" USING btree ("_parent_id");
  CREATE INDEX "_avvisi_v_version_allegati_file_idx" ON "_avvisi_v_version_allegati" USING btree ("file_id");
  CREATE INDEX "_avvisi_v_parent_idx" ON "_avvisi_v" USING btree ("parent_id");
  CREATE INDEX "_avvisi_v_version_version_pubblicato_il_idx" ON "_avvisi_v" USING btree ("version_pubblicato_il");
  CREATE INDEX "_avvisi_v_version_version_slug_idx" ON "_avvisi_v" USING btree ("version_slug");
  CREATE INDEX "_avvisi_v_version_version_autore_idx" ON "_avvisi_v" USING btree ("version_autore_id");
  CREATE INDEX "_avvisi_v_version_version_updated_at_idx" ON "_avvisi_v" USING btree ("version_updated_at");
  CREATE INDEX "_avvisi_v_version_version_created_at_idx" ON "_avvisi_v" USING btree ("version_created_at");
  CREATE INDEX "_avvisi_v_version_version__status_idx" ON "_avvisi_v" USING btree ("version__status");
  CREATE INDEX "_avvisi_v_created_at_idx" ON "_avvisi_v" USING btree ("created_at");
  CREATE INDEX "_avvisi_v_updated_at_idx" ON "_avvisi_v" USING btree ("updated_at");
  CREATE INDEX "_avvisi_v_latest_idx" ON "_avvisi_v" USING btree ("latest");
  CREATE INDEX "_avvisi_v_rels_order_idx" ON "_avvisi_v_rels" USING btree ("order");
  CREATE INDEX "_avvisi_v_rels_parent_idx" ON "_avvisi_v_rels" USING btree ("parent_id");
  CREATE INDEX "_avvisi_v_rels_path_idx" ON "_avvisi_v_rels" USING btree ("path");
  CREATE INDEX "_avvisi_v_rels_scuole_id_idx" ON "_avvisi_v_rels" USING btree ("scuole_id");
  CREATE UNIQUE INDEX "scuole_slug_idx" ON "scuole" USING btree ("slug");
  CREATE INDEX "scuole_updated_at_idx" ON "scuole" USING btree ("updated_at");
  CREATE INDEX "scuole_created_at_idx" ON "scuole" USING btree ("created_at");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_avvisi_fk" FOREIGN KEY ("avvisi_id") REFERENCES "public"."avvisi"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_scuole_fk" FOREIGN KEY ("scuole_id") REFERENCES "public"."scuole"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_avvisi_id_idx" ON "payload_locked_documents_rels" USING btree ("avvisi_id");
  CREATE INDEX "payload_locked_documents_rels_scuole_id_idx" ON "payload_locked_documents_rels" USING btree ("scuole_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "avvisi_categorie" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "avvisi_allegati" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "avvisi" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "avvisi_rels" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_avvisi_v_version_categorie" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_avvisi_v_version_allegati" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_avvisi_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_avvisi_v_rels" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "scuole" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "avvisi_categorie" CASCADE;
  DROP TABLE "avvisi_allegati" CASCADE;
  DROP TABLE "avvisi" CASCADE;
  DROP TABLE "avvisi_rels" CASCADE;
  DROP TABLE "_avvisi_v_version_categorie" CASCADE;
  DROP TABLE "_avvisi_v_version_allegati" CASCADE;
  DROP TABLE "_avvisi_v" CASCADE;
  DROP TABLE "_avvisi_v_rels" CASCADE;
  DROP TABLE "scuole" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_avvisi_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_scuole_fk";
  
  DROP INDEX "payload_locked_documents_rels_avvisi_id_idx";
  DROP INDEX "payload_locked_documents_rels_scuole_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "avvisi_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "scuole_id";
  DROP TYPE "public"."enum_avvisi_categorie";
  DROP TYPE "public"."enum_avvisi_status";
  DROP TYPE "public"."enum__avvisi_v_version_categorie";
  DROP TYPE "public"."enum__avvisi_v_version_status";`)
}
