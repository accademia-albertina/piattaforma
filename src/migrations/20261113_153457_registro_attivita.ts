import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_registro_attivita_azione" AS ENUM('creato', 'modificato', 'pubblicato', 'ritirato', 'eliminato');
  CREATE TABLE "registro_attivita" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"azione" "enum_registro_attivita_azione" NOT NULL,
  	"utente_id" integer,
  	"utente_nome" varchar,
  	"utente_email" varchar,
  	"collezione" varchar NOT NULL,
  	"sezione" varchar,
  	"documento_id" varchar,
  	"titolo" varchar,
  	"campi" varchar,
  	"riepilogo" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "registro_attivita_id" integer;
  ALTER TABLE "registro_attivita" ADD CONSTRAINT "registro_attivita_utente_id_users_id_fk" FOREIGN KEY ("utente_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "registro_attivita_created_at_idx" ON "registro_attivita" USING btree ("created_at");
  CREATE INDEX "registro_attivita_azione_idx" ON "registro_attivita" USING btree ("azione");
  CREATE INDEX "registro_attivita_utente_idx" ON "registro_attivita" USING btree ("utente_id");
  CREATE INDEX "registro_attivita_collezione_idx" ON "registro_attivita" USING btree ("collezione");
  CREATE INDEX "registro_attivita_documento_id_idx" ON "registro_attivita" USING btree ("documento_id");
  CREATE INDEX "registro_attivita_updated_at_idx" ON "registro_attivita" USING btree ("updated_at");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_registro_attivita_fk" FOREIGN KEY ("registro_attivita_id") REFERENCES "public"."registro_attivita"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_registro_attivita_id_idx" ON "payload_locked_documents_rels" USING btree ("registro_attivita_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "registro_attivita" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "registro_attivita" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_registro_attivita_fk";
  
  DROP INDEX "payload_locked_documents_rels_registro_attivita_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "registro_attivita_id";
  DROP TYPE "public"."enum_registro_attivita_azione";`)
}
