import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_appelli_livelli" AS ENUM('triennio', 'biennio');
  CREATE TYPE "public"."enum_appelli_sessione" AS ENUM('invernale', 'estiva', 'autunnale');
  CREATE TYPE "public"."enum_iscrizioni_esami_livello" AS ENUM('triennio', 'biennio');
  CREATE TABLE "appelli_livelli" (
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"value" "enum_appelli_livelli",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "appelli" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"titolo" varchar,
  	"corso_id" integer NOT NULL,
  	"anno_accademico" varchar NOT NULL,
  	"sessione" "enum_appelli_sessione" NOT NULL,
  	"data" timestamp(3) with time zone NOT NULL,
  	"ora" varchar NOT NULL,
  	"aula" varchar,
  	"commissione" varchar,
  	"note" varchar,
  	"proroga_iscrizioni" timestamp(3) with time zone,
  	"creato_da_id" integer,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "iscrizioni_esami" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"appello_id" integer NOT NULL,
  	"studente_id" integer NOT NULL,
  	"nominativo" varchar,
  	"matricola" varchar,
  	"livello" "enum_iscrizioni_esami_livello",
  	"email" varchar,
  	"corso_id" integer,
  	"anno_accademico" varchar,
  	"sessione" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "finestre_iscrizione" ADD COLUMN "solo_iscritti_al_corso" boolean DEFAULT false;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "appelli_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "iscrizioni_esami_id" integer;
  ALTER TABLE "appelli_livelli" ADD CONSTRAINT "appelli_livelli_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."appelli"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "appelli" ADD CONSTRAINT "appelli_corso_id_corsi_id_fk" FOREIGN KEY ("corso_id") REFERENCES "public"."corsi"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "appelli" ADD CONSTRAINT "appelli_creato_da_id_users_id_fk" FOREIGN KEY ("creato_da_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "iscrizioni_esami" ADD CONSTRAINT "iscrizioni_esami_appello_id_appelli_id_fk" FOREIGN KEY ("appello_id") REFERENCES "public"."appelli"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "iscrizioni_esami" ADD CONSTRAINT "iscrizioni_esami_studente_id_users_id_fk" FOREIGN KEY ("studente_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "iscrizioni_esami" ADD CONSTRAINT "iscrizioni_esami_corso_id_corsi_id_fk" FOREIGN KEY ("corso_id") REFERENCES "public"."corsi"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "appelli_livelli_order_idx" ON "appelli_livelli" USING btree ("order");
  CREATE INDEX "appelli_livelli_parent_idx" ON "appelli_livelli" USING btree ("parent_id");
  CREATE INDEX "appelli_corso_idx" ON "appelli" USING btree ("corso_id");
  CREATE INDEX "appelli_anno_accademico_idx" ON "appelli" USING btree ("anno_accademico");
  CREATE INDEX "appelli_sessione_idx" ON "appelli" USING btree ("sessione");
  CREATE INDEX "appelli_data_idx" ON "appelli" USING btree ("data");
  CREATE INDEX "appelli_creato_da_idx" ON "appelli" USING btree ("creato_da_id");
  CREATE INDEX "appelli_updated_at_idx" ON "appelli" USING btree ("updated_at");
  CREATE INDEX "appelli_created_at_idx" ON "appelli" USING btree ("created_at");
  CREATE INDEX "iscrizioni_esami_appello_idx" ON "iscrizioni_esami" USING btree ("appello_id");
  CREATE INDEX "iscrizioni_esami_studente_idx" ON "iscrizioni_esami" USING btree ("studente_id");
  CREATE INDEX "iscrizioni_esami_corso_idx" ON "iscrizioni_esami" USING btree ("corso_id");
  CREATE INDEX "iscrizioni_esami_updated_at_idx" ON "iscrizioni_esami" USING btree ("updated_at");
  CREATE INDEX "iscrizioni_esami_created_at_idx" ON "iscrizioni_esami" USING btree ("created_at");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_appelli_fk" FOREIGN KEY ("appelli_id") REFERENCES "public"."appelli"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_iscrizioni_esami_fk" FOREIGN KEY ("iscrizioni_esami_id") REFERENCES "public"."iscrizioni_esami"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_appelli_id_idx" ON "payload_locked_documents_rels" USING btree ("appelli_id");
  CREATE INDEX "payload_locked_documents_rels_iscrizioni_esami_id_idx" ON "payload_locked_documents_rels" USING btree ("iscrizioni_esami_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "appelli_livelli" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "appelli" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "iscrizioni_esami" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "appelli_livelli" CASCADE;
  DROP TABLE "appelli" CASCADE;
  DROP TABLE "iscrizioni_esami" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_appelli_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_iscrizioni_esami_fk";
  
  DROP INDEX "payload_locked_documents_rels_appelli_id_idx";
  DROP INDEX "payload_locked_documents_rels_iscrizioni_esami_id_idx";
  ALTER TABLE "finestre_iscrizione" DROP COLUMN "solo_iscritti_al_corso";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "appelli_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "iscrizioni_esami_id";
  DROP TYPE "public"."enum_appelli_livelli";
  DROP TYPE "public"."enum_appelli_sessione";
  DROP TYPE "public"."enum_iscrizioni_esami_livello";`)
}
