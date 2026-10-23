import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_corsi_livelli" AS ENUM('triennio', 'biennio');
  CREATE TYPE "public"."enum_corsi_orari_semestre" AS ENUM('primo', 'secondo', 'annuale');
  CREATE TYPE "public"."enum_corsi_orari_giorno" AS ENUM('lunedi', 'martedi', 'mercoledi', 'giovedi', 'venerdi', 'sabato');
  CREATE TYPE "public"."enum_corsi_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__corsi_v_version_livelli" AS ENUM('triennio', 'biennio');
  CREATE TYPE "public"."enum__corsi_v_version_orari_semestre" AS ENUM('primo', 'secondo', 'annuale');
  CREATE TYPE "public"."enum__corsi_v_version_orari_giorno" AS ENUM('lunedi', 'martedi', 'mercoledi', 'giovedi', 'venerdi', 'sabato');
  CREATE TYPE "public"."enum__corsi_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum_docenti_ruolo" AS ENUM('tempo-indeterminato', 'tempo-determinato', 'contratto');
  CREATE TABLE "corsi_livelli" (
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"value" "enum_corsi_livelli",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "corsi_orari" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"semestre" "enum_corsi_orari_semestre",
  	"giorno" "enum_corsi_orari_giorno",
  	"dalle" varchar,
  	"alle" varchar,
  	"aula" varchar
  );
  
  CREATE TABLE "corsi" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"titolo" varchar,
  	"anno_accademico" varchar,
  	"crediti" numeric,
  	"settore" varchar,
  	"area_disciplinare" varchar,
  	"descrizione" jsonb,
  	"bibliografia" jsonb,
  	"esoneri" boolean,
  	"revisioni" boolean,
  	"altre_informazioni" jsonb,
  	"slug" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_corsi_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "corsi_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"docenti_id" integer,
  	"scuole_id" integer
  );
  
  CREATE TABLE "_corsi_v_version_livelli" (
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"value" "enum__corsi_v_version_livelli",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "_corsi_v_version_orari" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"semestre" "enum__corsi_v_version_orari_semestre",
  	"giorno" "enum__corsi_v_version_orari_giorno",
  	"dalle" varchar,
  	"alle" varchar,
  	"aula" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_corsi_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_titolo" varchar,
  	"version_anno_accademico" varchar,
  	"version_crediti" numeric,
  	"version_settore" varchar,
  	"version_area_disciplinare" varchar,
  	"version_descrizione" jsonb,
  	"version_bibliografia" jsonb,
  	"version_esoneri" boolean,
  	"version_revisioni" boolean,
  	"version_altre_informazioni" jsonb,
  	"version_slug" varchar,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__corsi_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean
  );
  
  CREATE TABLE "_corsi_v_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"docenti_id" integer,
  	"scuole_id" integer
  );
  
  CREATE TABLE "docenti" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"nome" varchar NOT NULL,
  	"cognome" varchar NOT NULL,
  	"nome_completo" varchar,
  	"email" varchar,
  	"ruolo" "enum_docenti_ruolo",
  	"foto_id" integer,
  	"ricevimento" varchar,
  	"biografia" jsonb,
  	"cv_id" integer,
  	"attivo" boolean DEFAULT true,
  	"account_id" integer,
  	"slug" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "docenti_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"scuole_id" integer
  );
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "corsi_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "docenti_id" integer;
  ALTER TABLE "corsi_livelli" ADD CONSTRAINT "corsi_livelli_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."corsi"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "corsi_orari" ADD CONSTRAINT "corsi_orari_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."corsi"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "corsi_rels" ADD CONSTRAINT "corsi_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."corsi"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "corsi_rels" ADD CONSTRAINT "corsi_rels_docenti_fk" FOREIGN KEY ("docenti_id") REFERENCES "public"."docenti"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "corsi_rels" ADD CONSTRAINT "corsi_rels_scuole_fk" FOREIGN KEY ("scuole_id") REFERENCES "public"."scuole"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_corsi_v_version_livelli" ADD CONSTRAINT "_corsi_v_version_livelli_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_corsi_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_corsi_v_version_orari" ADD CONSTRAINT "_corsi_v_version_orari_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_corsi_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_corsi_v" ADD CONSTRAINT "_corsi_v_parent_id_corsi_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."corsi"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_corsi_v_rels" ADD CONSTRAINT "_corsi_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_corsi_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_corsi_v_rels" ADD CONSTRAINT "_corsi_v_rels_docenti_fk" FOREIGN KEY ("docenti_id") REFERENCES "public"."docenti"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_corsi_v_rels" ADD CONSTRAINT "_corsi_v_rels_scuole_fk" FOREIGN KEY ("scuole_id") REFERENCES "public"."scuole"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "docenti" ADD CONSTRAINT "docenti_foto_id_media_id_fk" FOREIGN KEY ("foto_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "docenti" ADD CONSTRAINT "docenti_cv_id_media_id_fk" FOREIGN KEY ("cv_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "docenti" ADD CONSTRAINT "docenti_account_id_users_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "docenti_rels" ADD CONSTRAINT "docenti_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."docenti"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "docenti_rels" ADD CONSTRAINT "docenti_rels_scuole_fk" FOREIGN KEY ("scuole_id") REFERENCES "public"."scuole"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "corsi_livelli_order_idx" ON "corsi_livelli" USING btree ("order");
  CREATE INDEX "corsi_livelli_parent_idx" ON "corsi_livelli" USING btree ("parent_id");
  CREATE INDEX "corsi_livelli_value_idx" ON "corsi_livelli" USING btree ("value");
  CREATE INDEX "corsi_orari_order_idx" ON "corsi_orari" USING btree ("_order");
  CREATE INDEX "corsi_orari_parent_id_idx" ON "corsi_orari" USING btree ("_parent_id");
  CREATE INDEX "corsi_anno_accademico_idx" ON "corsi" USING btree ("anno_accademico");
  CREATE UNIQUE INDEX "corsi_slug_idx" ON "corsi" USING btree ("slug");
  CREATE INDEX "corsi_updated_at_idx" ON "corsi" USING btree ("updated_at");
  CREATE INDEX "corsi_created_at_idx" ON "corsi" USING btree ("created_at");
  CREATE INDEX "corsi__status_idx" ON "corsi" USING btree ("_status");
  CREATE INDEX "corsi_rels_order_idx" ON "corsi_rels" USING btree ("order");
  CREATE INDEX "corsi_rels_parent_idx" ON "corsi_rels" USING btree ("parent_id");
  CREATE INDEX "corsi_rels_path_idx" ON "corsi_rels" USING btree ("path");
  CREATE INDEX "corsi_rels_docenti_id_idx" ON "corsi_rels" USING btree ("docenti_id");
  CREATE INDEX "corsi_rels_scuole_id_idx" ON "corsi_rels" USING btree ("scuole_id");
  CREATE INDEX "_corsi_v_version_livelli_order_idx" ON "_corsi_v_version_livelli" USING btree ("order");
  CREATE INDEX "_corsi_v_version_livelli_parent_idx" ON "_corsi_v_version_livelli" USING btree ("parent_id");
  CREATE INDEX "_corsi_v_version_livelli_value_idx" ON "_corsi_v_version_livelli" USING btree ("value");
  CREATE INDEX "_corsi_v_version_orari_order_idx" ON "_corsi_v_version_orari" USING btree ("_order");
  CREATE INDEX "_corsi_v_version_orari_parent_id_idx" ON "_corsi_v_version_orari" USING btree ("_parent_id");
  CREATE INDEX "_corsi_v_parent_idx" ON "_corsi_v" USING btree ("parent_id");
  CREATE INDEX "_corsi_v_version_version_anno_accademico_idx" ON "_corsi_v" USING btree ("version_anno_accademico");
  CREATE INDEX "_corsi_v_version_version_slug_idx" ON "_corsi_v" USING btree ("version_slug");
  CREATE INDEX "_corsi_v_version_version_updated_at_idx" ON "_corsi_v" USING btree ("version_updated_at");
  CREATE INDEX "_corsi_v_version_version_created_at_idx" ON "_corsi_v" USING btree ("version_created_at");
  CREATE INDEX "_corsi_v_version_version__status_idx" ON "_corsi_v" USING btree ("version__status");
  CREATE INDEX "_corsi_v_created_at_idx" ON "_corsi_v" USING btree ("created_at");
  CREATE INDEX "_corsi_v_updated_at_idx" ON "_corsi_v" USING btree ("updated_at");
  CREATE INDEX "_corsi_v_latest_idx" ON "_corsi_v" USING btree ("latest");
  CREATE INDEX "_corsi_v_rels_order_idx" ON "_corsi_v_rels" USING btree ("order");
  CREATE INDEX "_corsi_v_rels_parent_idx" ON "_corsi_v_rels" USING btree ("parent_id");
  CREATE INDEX "_corsi_v_rels_path_idx" ON "_corsi_v_rels" USING btree ("path");
  CREATE INDEX "_corsi_v_rels_docenti_id_idx" ON "_corsi_v_rels" USING btree ("docenti_id");
  CREATE INDEX "_corsi_v_rels_scuole_id_idx" ON "_corsi_v_rels" USING btree ("scuole_id");
  CREATE INDEX "docenti_cognome_idx" ON "docenti" USING btree ("cognome");
  CREATE INDEX "docenti_foto_idx" ON "docenti" USING btree ("foto_id");
  CREATE INDEX "docenti_cv_idx" ON "docenti" USING btree ("cv_id");
  CREATE INDEX "docenti_attivo_idx" ON "docenti" USING btree ("attivo");
  CREATE UNIQUE INDEX "docenti_account_idx" ON "docenti" USING btree ("account_id");
  CREATE UNIQUE INDEX "docenti_slug_idx" ON "docenti" USING btree ("slug");
  CREATE INDEX "docenti_updated_at_idx" ON "docenti" USING btree ("updated_at");
  CREATE INDEX "docenti_created_at_idx" ON "docenti" USING btree ("created_at");
  CREATE INDEX "docenti_rels_order_idx" ON "docenti_rels" USING btree ("order");
  CREATE INDEX "docenti_rels_parent_idx" ON "docenti_rels" USING btree ("parent_id");
  CREATE INDEX "docenti_rels_path_idx" ON "docenti_rels" USING btree ("path");
  CREATE INDEX "docenti_rels_scuole_id_idx" ON "docenti_rels" USING btree ("scuole_id");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_corsi_fk" FOREIGN KEY ("corsi_id") REFERENCES "public"."corsi"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_docenti_fk" FOREIGN KEY ("docenti_id") REFERENCES "public"."docenti"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_corsi_id_idx" ON "payload_locked_documents_rels" USING btree ("corsi_id");
  CREATE INDEX "payload_locked_documents_rels_docenti_id_idx" ON "payload_locked_documents_rels" USING btree ("docenti_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "corsi_livelli" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "corsi_orari" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "corsi" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "corsi_rels" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_corsi_v_version_livelli" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_corsi_v_version_orari" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_corsi_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_corsi_v_rels" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "docenti" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "docenti_rels" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "corsi_livelli" CASCADE;
  DROP TABLE "corsi_orari" CASCADE;
  DROP TABLE "corsi" CASCADE;
  DROP TABLE "corsi_rels" CASCADE;
  DROP TABLE "_corsi_v_version_livelli" CASCADE;
  DROP TABLE "_corsi_v_version_orari" CASCADE;
  DROP TABLE "_corsi_v" CASCADE;
  DROP TABLE "_corsi_v_rels" CASCADE;
  DROP TABLE "docenti" CASCADE;
  DROP TABLE "docenti_rels" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_corsi_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_docenti_fk";
  
  DROP INDEX "payload_locked_documents_rels_corsi_id_idx";
  DROP INDEX "payload_locked_documents_rels_docenti_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "corsi_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "docenti_id";
  DROP TYPE "public"."enum_corsi_livelli";
  DROP TYPE "public"."enum_corsi_orari_semestre";
  DROP TYPE "public"."enum_corsi_orari_giorno";
  DROP TYPE "public"."enum_corsi_status";
  DROP TYPE "public"."enum__corsi_v_version_livelli";
  DROP TYPE "public"."enum__corsi_v_version_orari_semestre";
  DROP TYPE "public"."enum__corsi_v_version_orari_giorno";
  DROP TYPE "public"."enum__corsi_v_version_status";
  DROP TYPE "public"."enum_docenti_ruolo";`)
}
