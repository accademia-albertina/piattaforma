import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_calendari_tipo" AS ENUM('lezioni', 'esami', 'presentazioni');
  CREATE TYPE "public"."enum_calendari_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__calendari_v_version_tipo" AS ENUM('lezioni', 'esami', 'presentazioni');
  CREATE TYPE "public"."enum__calendari_v_version_status" AS ENUM('draft', 'published');
  CREATE TABLE "calendari" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"tipo" "enum_calendari_tipo" DEFAULT 'lezioni',
  	"anno_accademico" varchar,
  	"titolo" varchar,
  	"sottotitolo" varchar,
  	"slug" varchar,
  	"avvertenze" varchar,
  	"sedi" varchar,
  	"righe" jsonb DEFAULT '[]'::jsonb,
  	"pdf_id" integer,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_calendari_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "_calendari_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_tipo" "enum__calendari_v_version_tipo" DEFAULT 'lezioni',
  	"version_anno_accademico" varchar,
  	"version_titolo" varchar,
  	"version_sottotitolo" varchar,
  	"version_slug" varchar,
  	"version_avvertenze" varchar,
  	"version_sedi" varchar,
  	"version_righe" jsonb DEFAULT '[]'::jsonb,
  	"version_pdf_id" integer,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__calendari_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean
  );
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "calendari_id" integer;
  ALTER TABLE "calendari" ADD CONSTRAINT "calendari_pdf_id_media_id_fk" FOREIGN KEY ("pdf_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_calendari_v" ADD CONSTRAINT "_calendari_v_parent_id_calendari_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."calendari"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_calendari_v" ADD CONSTRAINT "_calendari_v_version_pdf_id_media_id_fk" FOREIGN KEY ("version_pdf_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  CREATE UNIQUE INDEX "calendari_slug_idx" ON "calendari" USING btree ("slug");
  CREATE INDEX "calendari_pdf_idx" ON "calendari" USING btree ("pdf_id");
  CREATE INDEX "calendari_updated_at_idx" ON "calendari" USING btree ("updated_at");
  CREATE INDEX "calendari_created_at_idx" ON "calendari" USING btree ("created_at");
  CREATE INDEX "calendari__status_idx" ON "calendari" USING btree ("_status");
  CREATE INDEX "_calendari_v_parent_idx" ON "_calendari_v" USING btree ("parent_id");
  CREATE INDEX "_calendari_v_version_version_slug_idx" ON "_calendari_v" USING btree ("version_slug");
  CREATE INDEX "_calendari_v_version_version_pdf_idx" ON "_calendari_v" USING btree ("version_pdf_id");
  CREATE INDEX "_calendari_v_version_version_updated_at_idx" ON "_calendari_v" USING btree ("version_updated_at");
  CREATE INDEX "_calendari_v_version_version_created_at_idx" ON "_calendari_v" USING btree ("version_created_at");
  CREATE INDEX "_calendari_v_version_version__status_idx" ON "_calendari_v" USING btree ("version__status");
  CREATE INDEX "_calendari_v_created_at_idx" ON "_calendari_v" USING btree ("created_at");
  CREATE INDEX "_calendari_v_updated_at_idx" ON "_calendari_v" USING btree ("updated_at");
  CREATE INDEX "_calendari_v_latest_idx" ON "_calendari_v" USING btree ("latest");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_calendari_fk" FOREIGN KEY ("calendari_id") REFERENCES "public"."calendari"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_calendari_id_idx" ON "payload_locked_documents_rels" USING btree ("calendari_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "calendari" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_calendari_v" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "calendari" CASCADE;
  DROP TABLE "_calendari_v" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_calendari_fk";
  
  DROP INDEX "payload_locked_documents_rels_calendari_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "calendari_id";
  DROP TYPE "public"."enum_calendari_tipo";
  DROP TYPE "public"."enum_calendari_status";
  DROP TYPE "public"."enum__calendari_v_version_tipo";
  DROP TYPE "public"."enum__calendari_v_version_status";`)
}
