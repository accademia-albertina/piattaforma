import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_pubblicazioni_collana" AS ENUM('arcate', 'galleria', 'hbitat', 'quaderni', 'r-esistenze', 'visioni');
  CREATE TABLE "pubblicazioni_indice" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"pagina" varchar,
  	"titolo" varchar NOT NULL,
  	"autori" varchar
  );
  
  CREATE TABLE "pubblicazioni" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"titolo" varchar NOT NULL,
  	"autori" varchar,
  	"copertina_id" integer,
  	"descrizione" varchar,
  	"numero" numeric,
  	"collana" "enum_pubblicazioni_collana",
  	"anno" numeric,
  	"luogo_anno" varchar,
  	"pagine" numeric,
  	"dimensioni" varchar,
  	"lingua" varchar,
  	"isbn" varchar,
  	"prezzo" numeric,
  	"slug" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "pubblicazioni_id" integer;
  ALTER TABLE "pubblicazioni_indice" ADD CONSTRAINT "pubblicazioni_indice_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pubblicazioni"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pubblicazioni" ADD CONSTRAINT "pubblicazioni_copertina_id_media_id_fk" FOREIGN KEY ("copertina_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "pubblicazioni_indice_order_idx" ON "pubblicazioni_indice" USING btree ("_order");
  CREATE INDEX "pubblicazioni_indice_parent_id_idx" ON "pubblicazioni_indice" USING btree ("_parent_id");
  CREATE INDEX "pubblicazioni_copertina_idx" ON "pubblicazioni" USING btree ("copertina_id");
  CREATE INDEX "pubblicazioni_numero_idx" ON "pubblicazioni" USING btree ("numero");
  CREATE INDEX "pubblicazioni_collana_idx" ON "pubblicazioni" USING btree ("collana");
  CREATE INDEX "pubblicazioni_anno_idx" ON "pubblicazioni" USING btree ("anno");
  CREATE UNIQUE INDEX "pubblicazioni_slug_idx" ON "pubblicazioni" USING btree ("slug");
  CREATE INDEX "pubblicazioni_updated_at_idx" ON "pubblicazioni" USING btree ("updated_at");
  CREATE INDEX "pubblicazioni_created_at_idx" ON "pubblicazioni" USING btree ("created_at");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_pubblicazioni_fk" FOREIGN KEY ("pubblicazioni_id") REFERENCES "public"."pubblicazioni"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_pubblicazioni_id_idx" ON "payload_locked_documents_rels" USING btree ("pubblicazioni_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "pubblicazioni_indice" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pubblicazioni" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "pubblicazioni_indice" CASCADE;
  DROP TABLE "pubblicazioni" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_pubblicazioni_fk";
  
  DROP INDEX "payload_locked_documents_rels_pubblicazioni_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "pubblicazioni_id";
  DROP TYPE "public"."enum_pubblicazioni_collana";`)
}
