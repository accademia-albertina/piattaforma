import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "scuole_triennio_sezioni" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"titolo" varchar,
  	"testo" jsonb
  );
  
  CREATE TABLE "scuole_triennio_piani" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"nome" varchar,
  	"file_id" integer,
  	"url" varchar
  );
  
  CREATE TABLE "scuole_biennio_sezioni" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"titolo" varchar,
  	"testo" jsonb
  );
  
  CREATE TABLE "scuole_biennio_piani" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"nome" varchar,
  	"file_id" integer,
  	"url" varchar
  );
  
  ALTER TABLE "scuole" ADD COLUMN "video" varchar;
  ALTER TABLE "scuole" ADD COLUMN "triennio_attivo" boolean DEFAULT true;
  ALTER TABLE "scuole" ADD COLUMN "biennio_attivo" boolean DEFAULT true;
  ALTER TABLE "scuole" ADD COLUMN "coordinatore_dipartimento_id" integer;
  ALTER TABLE "scuole" ADD COLUMN "coordinatore_scuola_id" integer;
  ALTER TABLE "scuole_triennio_sezioni" ADD CONSTRAINT "scuole_triennio_sezioni_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."scuole"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "scuole_triennio_piani" ADD CONSTRAINT "scuole_triennio_piani_file_id_media_id_fk" FOREIGN KEY ("file_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "scuole_triennio_piani" ADD CONSTRAINT "scuole_triennio_piani_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."scuole"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "scuole_biennio_sezioni" ADD CONSTRAINT "scuole_biennio_sezioni_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."scuole"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "scuole_biennio_piani" ADD CONSTRAINT "scuole_biennio_piani_file_id_media_id_fk" FOREIGN KEY ("file_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "scuole_biennio_piani" ADD CONSTRAINT "scuole_biennio_piani_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."scuole"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "scuole_triennio_sezioni_order_idx" ON "scuole_triennio_sezioni" USING btree ("_order");
  CREATE INDEX "scuole_triennio_sezioni_parent_id_idx" ON "scuole_triennio_sezioni" USING btree ("_parent_id");
  CREATE INDEX "scuole_triennio_piani_order_idx" ON "scuole_triennio_piani" USING btree ("_order");
  CREATE INDEX "scuole_triennio_piani_parent_id_idx" ON "scuole_triennio_piani" USING btree ("_parent_id");
  CREATE INDEX "scuole_triennio_piani_file_idx" ON "scuole_triennio_piani" USING btree ("file_id");
  CREATE INDEX "scuole_biennio_sezioni_order_idx" ON "scuole_biennio_sezioni" USING btree ("_order");
  CREATE INDEX "scuole_biennio_sezioni_parent_id_idx" ON "scuole_biennio_sezioni" USING btree ("_parent_id");
  CREATE INDEX "scuole_biennio_piani_order_idx" ON "scuole_biennio_piani" USING btree ("_order");
  CREATE INDEX "scuole_biennio_piani_parent_id_idx" ON "scuole_biennio_piani" USING btree ("_parent_id");
  CREATE INDEX "scuole_biennio_piani_file_idx" ON "scuole_biennio_piani" USING btree ("file_id");
  ALTER TABLE "scuole" ADD CONSTRAINT "scuole_coordinatore_dipartimento_id_docenti_id_fk" FOREIGN KEY ("coordinatore_dipartimento_id") REFERENCES "public"."docenti"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "scuole" ADD CONSTRAINT "scuole_coordinatore_scuola_id_docenti_id_fk" FOREIGN KEY ("coordinatore_scuola_id") REFERENCES "public"."docenti"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "scuole_coordinatore_dipartimento_idx" ON "scuole" USING btree ("coordinatore_dipartimento_id");
  CREATE INDEX "scuole_coordinatore_scuola_idx" ON "scuole" USING btree ("coordinatore_scuola_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "scuole_triennio_sezioni" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "scuole_triennio_piani" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "scuole_biennio_sezioni" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "scuole_biennio_piani" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "scuole_triennio_sezioni" CASCADE;
  DROP TABLE "scuole_triennio_piani" CASCADE;
  DROP TABLE "scuole_biennio_sezioni" CASCADE;
  DROP TABLE "scuole_biennio_piani" CASCADE;
  ALTER TABLE "scuole" DROP CONSTRAINT "scuole_coordinatore_dipartimento_id_docenti_id_fk";
  
  ALTER TABLE "scuole" DROP CONSTRAINT "scuole_coordinatore_scuola_id_docenti_id_fk";
  
  DROP INDEX "scuole_coordinatore_dipartimento_idx";
  DROP INDEX "scuole_coordinatore_scuola_idx";
  ALTER TABLE "scuole" DROP COLUMN "video";
  ALTER TABLE "scuole" DROP COLUMN "triennio_attivo";
  ALTER TABLE "scuole" DROP COLUMN "biennio_attivo";
  ALTER TABLE "scuole" DROP COLUMN "coordinatore_dipartimento_id";
  ALTER TABLE "scuole" DROP COLUMN "coordinatore_scuola_id";`)
}
