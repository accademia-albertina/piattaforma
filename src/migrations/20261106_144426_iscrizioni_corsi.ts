import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_corsi_periodo_iscrizione" AS ENUM('primo', 'secondo');
  CREATE TYPE "public"."enum__corsi_v_version_periodo_iscrizione" AS ENUM('primo', 'secondo');
  CREATE TYPE "public"."enum_finestre_iscrizione_tipo" AS ENUM('corsi', 'esami');
  CREATE TYPE "public"."enum_finestre_iscrizione_periodo" AS ENUM('primo', 'secondo', 'invernale', 'estiva', 'autunnale');
  CREATE TYPE "public"."enum_iscrizioni_corsi_livello" AS ENUM('triennio', 'biennio');
  CREATE TABLE "finestre_iscrizione" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"titolo" varchar,
  	"tipo" "enum_finestre_iscrizione_tipo" DEFAULT 'corsi' NOT NULL,
  	"anno_accademico" varchar NOT NULL,
  	"periodo" "enum_finestre_iscrizione_periodo" NOT NULL,
  	"apertura" timestamp(3) with time zone NOT NULL,
  	"chiusura" timestamp(3) with time zone NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "iscrizioni_corsi" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"corso_id" integer NOT NULL,
  	"studente_id" integer NOT NULL,
  	"nominativo" varchar,
  	"matricola" varchar,
  	"livello" "enum_iscrizioni_corsi_livello",
  	"email" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "corsi" ADD COLUMN "periodo_iscrizione" "enum_corsi_periodo_iscrizione" DEFAULT 'primo';
  ALTER TABLE "corsi" ADD COLUMN "proroga_iscrizioni" timestamp(3) with time zone;
  ALTER TABLE "_corsi_v" ADD COLUMN "version_periodo_iscrizione" "enum__corsi_v_version_periodo_iscrizione" DEFAULT 'primo';
  ALTER TABLE "_corsi_v" ADD COLUMN "version_proroga_iscrizioni" timestamp(3) with time zone;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "finestre_iscrizione_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "iscrizioni_corsi_id" integer;
  ALTER TABLE "iscrizioni_corsi" ADD CONSTRAINT "iscrizioni_corsi_corso_id_corsi_id_fk" FOREIGN KEY ("corso_id") REFERENCES "public"."corsi"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "iscrizioni_corsi" ADD CONSTRAINT "iscrizioni_corsi_studente_id_users_id_fk" FOREIGN KEY ("studente_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "finestre_iscrizione_anno_accademico_idx" ON "finestre_iscrizione" USING btree ("anno_accademico");
  CREATE INDEX "finestre_iscrizione_apertura_idx" ON "finestre_iscrizione" USING btree ("apertura");
  CREATE INDEX "finestre_iscrizione_updated_at_idx" ON "finestre_iscrizione" USING btree ("updated_at");
  CREATE INDEX "finestre_iscrizione_created_at_idx" ON "finestre_iscrizione" USING btree ("created_at");
  CREATE INDEX "iscrizioni_corsi_corso_idx" ON "iscrizioni_corsi" USING btree ("corso_id");
  CREATE INDEX "iscrizioni_corsi_studente_idx" ON "iscrizioni_corsi" USING btree ("studente_id");
  CREATE INDEX "iscrizioni_corsi_updated_at_idx" ON "iscrizioni_corsi" USING btree ("updated_at");
  CREATE INDEX "iscrizioni_corsi_created_at_idx" ON "iscrizioni_corsi" USING btree ("created_at");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_finestre_iscrizione_fk" FOREIGN KEY ("finestre_iscrizione_id") REFERENCES "public"."finestre_iscrizione"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_iscrizioni_corsi_fk" FOREIGN KEY ("iscrizioni_corsi_id") REFERENCES "public"."iscrizioni_corsi"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_finestre_iscrizione_id_idx" ON "payload_locked_documents_rels" USING btree ("finestre_iscrizione_id");
  CREATE INDEX "payload_locked_documents_rels_iscrizioni_corsi_id_idx" ON "payload_locked_documents_rels" USING btree ("iscrizioni_corsi_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "finestre_iscrizione" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "iscrizioni_corsi" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "finestre_iscrizione" CASCADE;
  DROP TABLE "iscrizioni_corsi" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_finestre_iscrizione_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_iscrizioni_corsi_fk";
  
  DROP INDEX "payload_locked_documents_rels_finestre_iscrizione_id_idx";
  DROP INDEX "payload_locked_documents_rels_iscrizioni_corsi_id_idx";
  ALTER TABLE "corsi" DROP COLUMN "periodo_iscrizione";
  ALTER TABLE "corsi" DROP COLUMN "proroga_iscrizioni";
  ALTER TABLE "_corsi_v" DROP COLUMN "version_periodo_iscrizione";
  ALTER TABLE "_corsi_v" DROP COLUMN "version_proroga_iscrizioni";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "finestre_iscrizione_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "iscrizioni_corsi_id";
  DROP TYPE "public"."enum_corsi_periodo_iscrizione";
  DROP TYPE "public"."enum__corsi_v_version_periodo_iscrizione";
  DROP TYPE "public"."enum_finestre_iscrizione_tipo";
  DROP TYPE "public"."enum_finestre_iscrizione_periodo";
  DROP TYPE "public"."enum_iscrizioni_corsi_livello";`)
}
