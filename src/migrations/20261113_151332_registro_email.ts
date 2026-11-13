import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_email_inviate_esito" AS ENUM('inviata', 'errore', 'non-spedita');
  CREATE TABLE "email_inviate" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"destinatario" varchar,
  	"consegnata_a" varchar,
  	"oggetto" varchar,
  	"esito" "enum_email_inviate_esito" NOT NULL,
  	"errore" varchar,
  	"testo" varchar,
  	"id_messaggio" varchar,
  	"risposta" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "email_inviate_id" integer;
  CREATE INDEX "email_inviate_destinatario_idx" ON "email_inviate" USING btree ("destinatario");
  CREATE INDEX "email_inviate_esito_idx" ON "email_inviate" USING btree ("esito");
  CREATE INDEX "email_inviate_updated_at_idx" ON "email_inviate" USING btree ("updated_at");
  CREATE INDEX "email_inviate_created_at_idx" ON "email_inviate" USING btree ("created_at");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_email_inviate_fk" FOREIGN KEY ("email_inviate_id") REFERENCES "public"."email_inviate"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_email_inviate_id_idx" ON "payload_locked_documents_rels" USING btree ("email_inviate_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "email_inviate" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "email_inviate" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_email_inviate_fk";
  
  DROP INDEX "payload_locked_documents_rels_email_inviate_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "email_inviate_id";
  DROP TYPE "public"."enum_email_inviate_esito";`)
}
