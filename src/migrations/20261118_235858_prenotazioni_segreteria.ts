import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_prenotazioni_segreteria_stato" AS ENUM('prenotata', 'ritirata', 'assente', 'annullata');
  CREATE TYPE "public"."enum_prenotazioni_segreteria_tipo" AS ENUM('studente', 'personale', 'esterno', 'segreteria');
  CREATE TYPE "public"."enum_prenotazioni_segreteria_annullata_da" AS ENUM('utente', 'segreteria', 'chiusura');
  CREATE TYPE "public"."enum_sportello_segreteria_orari_giorno" AS ENUM('1', '2', '3', '4', '5', '6');
  CREATE TABLE "prenotazioni_segreteria" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"inizio" timestamp(3) with time zone NOT NULL,
  	"documento" varchar NOT NULL,
  	"stato" "enum_prenotazioni_segreteria_stato" DEFAULT 'prenotata',
  	"motivo_annullamento" varchar,
  	"cognome" varchar,
  	"nome" varchar,
  	"matricola" varchar,
  	"email" varchar NOT NULL,
  	"telefono" varchar,
  	"note_segreteria" varchar,
  	"tipo" "enum_prenotazioni_segreteria_tipo",
  	"utente_id" integer,
  	"annullata_da" "enum_prenotazioni_segreteria_annullata_da",
  	"annullata_il" timestamp(3) with time zone,
  	"nominativo" varchar,
  	"posto" varchar,
  	"token_disdetta" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "codici_email" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"email" varchar NOT NULL,
  	"impronta" varchar NOT NULL,
  	"scadenza" timestamp(3) with time zone NOT NULL,
  	"tentativi" numeric DEFAULT 0,
  	"usato" boolean DEFAULT false,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "sportello_segreteria_orari" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"giorno" "enum_sportello_segreteria_orari_giorno" NOT NULL,
  	"dalle" varchar NOT NULL,
  	"alle" varchar NOT NULL
  );
  
  CREATE TABLE "sportello_segreteria_aperture" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"data" timestamp(3) with time zone NOT NULL,
  	"dalle" varchar NOT NULL,
  	"alle" varchar NOT NULL
  );
  
  CREATE TABLE "sportello_segreteria_chiusure" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"dal" timestamp(3) with time zone NOT NULL,
  	"al" timestamp(3) with time zone,
  	"dalle" varchar,
  	"alle" varchar,
  	"motivo" varchar
  );
  
  CREATE TABLE "sportello_segreteria_documenti" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"nome" varchar NOT NULL,
  	"attivo" boolean DEFAULT true,
  	"descrizione" varchar
  );
  
  CREATE TABLE "sportello_segreteria" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"attivo" boolean DEFAULT true,
  	"avviso" varchar DEFAULT 'I documenti si ritirano in segreteria didattica il giorno dell’appuntamento. Prenota tenendo conto della scadenza per cui ti serve il documento.',
  	"durata_turno" numeric DEFAULT 5 NOT NULL,
  	"persone_per_turno" numeric DEFAULT 1 NOT NULL,
  	"giorni_prenotabili" numeric DEFAULT 60 NOT NULL,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "prenotazioni_segreteria_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "codici_email_id" integer;
  ALTER TABLE "prenotazioni_segreteria" ADD CONSTRAINT "prenotazioni_segreteria_utente_id_users_id_fk" FOREIGN KEY ("utente_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "sportello_segreteria_orari" ADD CONSTRAINT "sportello_segreteria_orari_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."sportello_segreteria"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "sportello_segreteria_aperture" ADD CONSTRAINT "sportello_segreteria_aperture_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."sportello_segreteria"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "sportello_segreteria_chiusure" ADD CONSTRAINT "sportello_segreteria_chiusure_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."sportello_segreteria"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "sportello_segreteria_documenti" ADD CONSTRAINT "sportello_segreteria_documenti_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."sportello_segreteria"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "prenotazioni_segreteria_inizio_idx" ON "prenotazioni_segreteria" USING btree ("inizio");
  CREATE INDEX "prenotazioni_segreteria_documento_idx" ON "prenotazioni_segreteria" USING btree ("documento");
  CREATE INDEX "prenotazioni_segreteria_stato_idx" ON "prenotazioni_segreteria" USING btree ("stato");
  CREATE INDEX "prenotazioni_segreteria_email_idx" ON "prenotazioni_segreteria" USING btree ("email");
  CREATE INDEX "prenotazioni_segreteria_utente_idx" ON "prenotazioni_segreteria" USING btree ("utente_id");
  CREATE UNIQUE INDEX "prenotazioni_segreteria_posto_idx" ON "prenotazioni_segreteria" USING btree ("posto");
  CREATE INDEX "prenotazioni_segreteria_updated_at_idx" ON "prenotazioni_segreteria" USING btree ("updated_at");
  CREATE INDEX "prenotazioni_segreteria_created_at_idx" ON "prenotazioni_segreteria" USING btree ("created_at");
  CREATE INDEX "codici_email_email_idx" ON "codici_email" USING btree ("email");
  CREATE INDEX "codici_email_updated_at_idx" ON "codici_email" USING btree ("updated_at");
  CREATE INDEX "codici_email_created_at_idx" ON "codici_email" USING btree ("created_at");
  CREATE INDEX "sportello_segreteria_orari_order_idx" ON "sportello_segreteria_orari" USING btree ("_order");
  CREATE INDEX "sportello_segreteria_orari_parent_id_idx" ON "sportello_segreteria_orari" USING btree ("_parent_id");
  CREATE INDEX "sportello_segreteria_aperture_order_idx" ON "sportello_segreteria_aperture" USING btree ("_order");
  CREATE INDEX "sportello_segreteria_aperture_parent_id_idx" ON "sportello_segreteria_aperture" USING btree ("_parent_id");
  CREATE INDEX "sportello_segreteria_chiusure_order_idx" ON "sportello_segreteria_chiusure" USING btree ("_order");
  CREATE INDEX "sportello_segreteria_chiusure_parent_id_idx" ON "sportello_segreteria_chiusure" USING btree ("_parent_id");
  CREATE INDEX "sportello_segreteria_documenti_order_idx" ON "sportello_segreteria_documenti" USING btree ("_order");
  CREATE INDEX "sportello_segreteria_documenti_parent_id_idx" ON "sportello_segreteria_documenti" USING btree ("_parent_id");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_prenotazioni_segreteria_fk" FOREIGN KEY ("prenotazioni_segreteria_id") REFERENCES "public"."prenotazioni_segreteria"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_codici_email_fk" FOREIGN KEY ("codici_email_id") REFERENCES "public"."codici_email"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_prenotazioni_segreteria_id_idx" ON "payload_locked_documents_rels" USING btree ("prenotazioni_segreteria_id");
  CREATE INDEX "payload_locked_documents_rels_codici_email_id_idx" ON "payload_locked_documents_rels" USING btree ("codici_email_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "prenotazioni_segreteria" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "codici_email" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "sportello_segreteria_orari" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "sportello_segreteria_aperture" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "sportello_segreteria_chiusure" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "sportello_segreteria_documenti" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "sportello_segreteria" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "prenotazioni_segreteria" CASCADE;
  DROP TABLE "codici_email" CASCADE;
  DROP TABLE "sportello_segreteria_orari" CASCADE;
  DROP TABLE "sportello_segreteria_aperture" CASCADE;
  DROP TABLE "sportello_segreteria_chiusure" CASCADE;
  DROP TABLE "sportello_segreteria_documenti" CASCADE;
  DROP TABLE "sportello_segreteria" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_prenotazioni_segreteria_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_codici_email_fk";
  
  DROP INDEX "payload_locked_documents_rels_prenotazioni_segreteria_id_idx";
  DROP INDEX "payload_locked_documents_rels_codici_email_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "prenotazioni_segreteria_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "codici_email_id";
  DROP TYPE "public"."enum_prenotazioni_segreteria_stato";
  DROP TYPE "public"."enum_prenotazioni_segreteria_tipo";
  DROP TYPE "public"."enum_prenotazioni_segreteria_annullata_da";
  DROP TYPE "public"."enum_sportello_segreteria_orari_giorno";`)
}
