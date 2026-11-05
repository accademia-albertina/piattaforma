import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_dottorandi_curriculum" AS ENUM('new-media-art', 'processi-espositivi');
  CREATE TABLE "dottorandi" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"nome" varchar NOT NULL,
  	"cognome" varchar NOT NULL,
  	"nome_completo" varchar,
  	"email" varchar,
  	"ciclo" varchar,
  	"curriculum" "enum_dottorandi_curriculum",
  	"tutor" varchar,
  	"foto_id" integer,
  	"titolo_progetto" varchar,
  	"abstract" jsonb,
  	"biografia" jsonb,
  	"attivo" boolean DEFAULT true,
  	"account_id" integer,
  	"slug" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "dottorandi_id" integer;
  ALTER TABLE "dottorandi" ADD CONSTRAINT "dottorandi_foto_id_media_id_fk" FOREIGN KEY ("foto_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "dottorandi" ADD CONSTRAINT "dottorandi_account_id_users_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "dottorandi_cognome_idx" ON "dottorandi" USING btree ("cognome");
  CREATE INDEX "dottorandi_ciclo_idx" ON "dottorandi" USING btree ("ciclo");
  CREATE INDEX "dottorandi_foto_idx" ON "dottorandi" USING btree ("foto_id");
  CREATE INDEX "dottorandi_attivo_idx" ON "dottorandi" USING btree ("attivo");
  CREATE UNIQUE INDEX "dottorandi_account_idx" ON "dottorandi" USING btree ("account_id");
  CREATE UNIQUE INDEX "dottorandi_slug_idx" ON "dottorandi" USING btree ("slug");
  CREATE INDEX "dottorandi_updated_at_idx" ON "dottorandi" USING btree ("updated_at");
  CREATE INDEX "dottorandi_created_at_idx" ON "dottorandi" USING btree ("created_at");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_dottorandi_fk" FOREIGN KEY ("dottorandi_id") REFERENCES "public"."dottorandi"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_dottorandi_id_idx" ON "payload_locked_documents_rels" USING btree ("dottorandi_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "dottorandi" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "dottorandi" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_dottorandi_fk";
  
  DROP INDEX "payload_locked_documents_rels_dottorandi_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "dottorandi_id";
  DROP TYPE "public"."enum_dottorandi_curriculum";`)
}
