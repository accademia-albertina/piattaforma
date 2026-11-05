import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_albo_sezione" AS ENUM('bandi-di-concorso', 'bandi-generici', 'bandi-di-gara', 'sindacale');
  CREATE TYPE "public"."enum_albo_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__albo_v_version_sezione" AS ENUM('bandi-di-concorso', 'bandi-generici', 'bandi-di-gara', 'sindacale');
  CREATE TYPE "public"."enum__albo_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum_trasparenza_sezione" AS ENUM('Disposizioni generali', 'Organizzazione', 'Consulenti e collaboratori', 'Personale', 'Bandi di concorso', 'Performance', 'Enti controllati', 'Attività e procedimenti', 'Provvedimenti', 'Controlli sulle imprese', 'Bandi di gara e contratti', 'Sovvenzioni, contributi, sussidi, vantaggi economici', 'Bilanci', 'Beni immobili e gestione patrimonio', 'Controlli e rilievi sull’amministrazione', 'Servizi erogati', 'Pagamenti dell’amministrazione', 'Opere pubbliche', 'Pianificazione e governo del territorio', 'Informazioni ambientali', 'Strutture sanitarie private accreditate', 'Interventi straordinari e di emergenza', 'Altri contenuti', 'Informative sito istituzionale');
  CREATE TYPE "public"."enum_trasparenza_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__trasparenza_v_version_sezione" AS ENUM('Disposizioni generali', 'Organizzazione', 'Consulenti e collaboratori', 'Personale', 'Bandi di concorso', 'Performance', 'Enti controllati', 'Attività e procedimenti', 'Provvedimenti', 'Controlli sulle imprese', 'Bandi di gara e contratti', 'Sovvenzioni, contributi, sussidi, vantaggi economici', 'Bilanci', 'Beni immobili e gestione patrimonio', 'Controlli e rilievi sull’amministrazione', 'Servizi erogati', 'Pagamenti dell’amministrazione', 'Opere pubbliche', 'Pianificazione e governo del territorio', 'Informazioni ambientali', 'Strutture sanitarie private accreditate', 'Interventi straordinari e di emergenza', 'Altri contenuti', 'Informative sito istituzionale');
  CREATE TYPE "public"."enum__trasparenza_v_version_status" AS ENUM('draft', 'published');
  CREATE TABLE "albo_documenti" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"nome" varchar,
  	"file_id" integer,
  	"url" varchar
  );
  
  CREATE TABLE "albo" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"titolo" varchar,
  	"sezione" "enum_albo_sezione",
  	"categoria" varchar,
  	"pubblicato_il" timestamp(3) with time zone,
  	"scadenza" timestamp(3) with time zone,
  	"anno_accademico" varchar,
  	"descrizione" varchar,
  	"slug" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_albo_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "_albo_v_version_documenti" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"nome" varchar,
  	"file_id" integer,
  	"url" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_albo_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_titolo" varchar,
  	"version_sezione" "enum__albo_v_version_sezione",
  	"version_categoria" varchar,
  	"version_pubblicato_il" timestamp(3) with time zone,
  	"version_scadenza" timestamp(3) with time zone,
  	"version_anno_accademico" varchar,
  	"version_descrizione" varchar,
  	"version_slug" varchar,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__albo_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean
  );
  
  CREATE TABLE "trasparenza_documenti" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"nome" varchar,
  	"file_id" integer,
  	"url" varchar,
  	"nota" varchar
  );
  
  CREATE TABLE "trasparenza" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"titolo" varchar,
  	"sezione" "enum_trasparenza_sezione",
  	"testo" varchar,
  	"aggiornato_il" timestamp(3) with time zone,
  	"slug" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_trasparenza_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "_trasparenza_v_version_documenti" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"nome" varchar,
  	"file_id" integer,
  	"url" varchar,
  	"nota" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_trasparenza_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_titolo" varchar,
  	"version_sezione" "enum__trasparenza_v_version_sezione",
  	"version_testo" varchar,
  	"version_aggiornato_il" timestamp(3) with time zone,
  	"version_slug" varchar,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__trasparenza_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean
  );
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "albo_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "trasparenza_id" integer;
  ALTER TABLE "albo_documenti" ADD CONSTRAINT "albo_documenti_file_id_media_id_fk" FOREIGN KEY ("file_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "albo_documenti" ADD CONSTRAINT "albo_documenti_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."albo"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_albo_v_version_documenti" ADD CONSTRAINT "_albo_v_version_documenti_file_id_media_id_fk" FOREIGN KEY ("file_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_albo_v_version_documenti" ADD CONSTRAINT "_albo_v_version_documenti_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_albo_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_albo_v" ADD CONSTRAINT "_albo_v_parent_id_albo_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."albo"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "trasparenza_documenti" ADD CONSTRAINT "trasparenza_documenti_file_id_media_id_fk" FOREIGN KEY ("file_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "trasparenza_documenti" ADD CONSTRAINT "trasparenza_documenti_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."trasparenza"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_trasparenza_v_version_documenti" ADD CONSTRAINT "_trasparenza_v_version_documenti_file_id_media_id_fk" FOREIGN KEY ("file_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_trasparenza_v_version_documenti" ADD CONSTRAINT "_trasparenza_v_version_documenti_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_trasparenza_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_trasparenza_v" ADD CONSTRAINT "_trasparenza_v_parent_id_trasparenza_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."trasparenza"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "albo_documenti_order_idx" ON "albo_documenti" USING btree ("_order");
  CREATE INDEX "albo_documenti_parent_id_idx" ON "albo_documenti" USING btree ("_parent_id");
  CREATE INDEX "albo_documenti_file_idx" ON "albo_documenti" USING btree ("file_id");
  CREATE INDEX "albo_sezione_idx" ON "albo" USING btree ("sezione");
  CREATE INDEX "albo_categoria_idx" ON "albo" USING btree ("categoria");
  CREATE INDEX "albo_pubblicato_il_idx" ON "albo" USING btree ("pubblicato_il");
  CREATE UNIQUE INDEX "albo_slug_idx" ON "albo" USING btree ("slug");
  CREATE INDEX "albo_updated_at_idx" ON "albo" USING btree ("updated_at");
  CREATE INDEX "albo_created_at_idx" ON "albo" USING btree ("created_at");
  CREATE INDEX "albo__status_idx" ON "albo" USING btree ("_status");
  CREATE INDEX "_albo_v_version_documenti_order_idx" ON "_albo_v_version_documenti" USING btree ("_order");
  CREATE INDEX "_albo_v_version_documenti_parent_id_idx" ON "_albo_v_version_documenti" USING btree ("_parent_id");
  CREATE INDEX "_albo_v_version_documenti_file_idx" ON "_albo_v_version_documenti" USING btree ("file_id");
  CREATE INDEX "_albo_v_parent_idx" ON "_albo_v" USING btree ("parent_id");
  CREATE INDEX "_albo_v_version_version_sezione_idx" ON "_albo_v" USING btree ("version_sezione");
  CREATE INDEX "_albo_v_version_version_categoria_idx" ON "_albo_v" USING btree ("version_categoria");
  CREATE INDEX "_albo_v_version_version_pubblicato_il_idx" ON "_albo_v" USING btree ("version_pubblicato_il");
  CREATE INDEX "_albo_v_version_version_slug_idx" ON "_albo_v" USING btree ("version_slug");
  CREATE INDEX "_albo_v_version_version_updated_at_idx" ON "_albo_v" USING btree ("version_updated_at");
  CREATE INDEX "_albo_v_version_version_created_at_idx" ON "_albo_v" USING btree ("version_created_at");
  CREATE INDEX "_albo_v_version_version__status_idx" ON "_albo_v" USING btree ("version__status");
  CREATE INDEX "_albo_v_created_at_idx" ON "_albo_v" USING btree ("created_at");
  CREATE INDEX "_albo_v_updated_at_idx" ON "_albo_v" USING btree ("updated_at");
  CREATE INDEX "_albo_v_latest_idx" ON "_albo_v" USING btree ("latest");
  CREATE INDEX "trasparenza_documenti_order_idx" ON "trasparenza_documenti" USING btree ("_order");
  CREATE INDEX "trasparenza_documenti_parent_id_idx" ON "trasparenza_documenti" USING btree ("_parent_id");
  CREATE INDEX "trasparenza_documenti_file_idx" ON "trasparenza_documenti" USING btree ("file_id");
  CREATE INDEX "trasparenza_sezione_idx" ON "trasparenza" USING btree ("sezione");
  CREATE UNIQUE INDEX "trasparenza_slug_idx" ON "trasparenza" USING btree ("slug");
  CREATE INDEX "trasparenza_updated_at_idx" ON "trasparenza" USING btree ("updated_at");
  CREATE INDEX "trasparenza_created_at_idx" ON "trasparenza" USING btree ("created_at");
  CREATE INDEX "trasparenza__status_idx" ON "trasparenza" USING btree ("_status");
  CREATE INDEX "_trasparenza_v_version_documenti_order_idx" ON "_trasparenza_v_version_documenti" USING btree ("_order");
  CREATE INDEX "_trasparenza_v_version_documenti_parent_id_idx" ON "_trasparenza_v_version_documenti" USING btree ("_parent_id");
  CREATE INDEX "_trasparenza_v_version_documenti_file_idx" ON "_trasparenza_v_version_documenti" USING btree ("file_id");
  CREATE INDEX "_trasparenza_v_parent_idx" ON "_trasparenza_v" USING btree ("parent_id");
  CREATE INDEX "_trasparenza_v_version_version_sezione_idx" ON "_trasparenza_v" USING btree ("version_sezione");
  CREATE INDEX "_trasparenza_v_version_version_slug_idx" ON "_trasparenza_v" USING btree ("version_slug");
  CREATE INDEX "_trasparenza_v_version_version_updated_at_idx" ON "_trasparenza_v" USING btree ("version_updated_at");
  CREATE INDEX "_trasparenza_v_version_version_created_at_idx" ON "_trasparenza_v" USING btree ("version_created_at");
  CREATE INDEX "_trasparenza_v_version_version__status_idx" ON "_trasparenza_v" USING btree ("version__status");
  CREATE INDEX "_trasparenza_v_created_at_idx" ON "_trasparenza_v" USING btree ("created_at");
  CREATE INDEX "_trasparenza_v_updated_at_idx" ON "_trasparenza_v" USING btree ("updated_at");
  CREATE INDEX "_trasparenza_v_latest_idx" ON "_trasparenza_v" USING btree ("latest");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_albo_fk" FOREIGN KEY ("albo_id") REFERENCES "public"."albo"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_trasparenza_fk" FOREIGN KEY ("trasparenza_id") REFERENCES "public"."trasparenza"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_albo_id_idx" ON "payload_locked_documents_rels" USING btree ("albo_id");
  CREATE INDEX "payload_locked_documents_rels_trasparenza_id_idx" ON "payload_locked_documents_rels" USING btree ("trasparenza_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "albo_documenti" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "albo" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_albo_v_version_documenti" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_albo_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "trasparenza_documenti" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "trasparenza" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_trasparenza_v_version_documenti" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_trasparenza_v" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "albo_documenti" CASCADE;
  DROP TABLE "albo" CASCADE;
  DROP TABLE "_albo_v_version_documenti" CASCADE;
  DROP TABLE "_albo_v" CASCADE;
  DROP TABLE "trasparenza_documenti" CASCADE;
  DROP TABLE "trasparenza" CASCADE;
  DROP TABLE "_trasparenza_v_version_documenti" CASCADE;
  DROP TABLE "_trasparenza_v" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_albo_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_trasparenza_fk";
  
  DROP INDEX "payload_locked_documents_rels_albo_id_idx";
  DROP INDEX "payload_locked_documents_rels_trasparenza_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "albo_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "trasparenza_id";
  DROP TYPE "public"."enum_albo_sezione";
  DROP TYPE "public"."enum_albo_status";
  DROP TYPE "public"."enum__albo_v_version_sezione";
  DROP TYPE "public"."enum__albo_v_version_status";
  DROP TYPE "public"."enum_trasparenza_sezione";
  DROP TYPE "public"."enum_trasparenza_status";
  DROP TYPE "public"."enum__trasparenza_v_version_sezione";
  DROP TYPE "public"."enum__trasparenza_v_version_status";`)
}
