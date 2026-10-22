import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_navigazione_in_evidenza_tipo" AS ENUM('interno', 'percorso', 'esterno');
  CREATE TYPE "public"."enum_navigazione_colonne_gruppi_voci_tipo" AS ENUM('interno', 'percorso', 'esterno');
  CREATE TYPE "public"."enum_navigazione_servizi_sinistra_tipo" AS ENUM('interno', 'percorso', 'esterno');
  CREATE TYPE "public"."enum_navigazione_servizi_destra_tipo" AS ENUM('interno', 'percorso', 'esterno');
  CREATE TYPE "public"."enum_navigazione_footer_link_tipo" AS ENUM('interno', 'percorso', 'esterno');
  CREATE TYPE "public"."enum_navigazione_footer_social_tipo" AS ENUM('interno', 'percorso', 'esterno');
  CREATE TYPE "public"."enum_navigazione_footer_legale_tipo" AS ENUM('interno', 'percorso', 'esterno');
  ALTER TYPE "public"."enum_pagine_blocks_link_voci_tipo" ADD VALUE 'percorso' BEFORE 'esterno';
  ALTER TYPE "public"."enum__pagine_v_blocks_link_voci_tipo" ADD VALUE 'percorso' BEFORE 'esterno';
  CREATE TABLE "navigazione_in_evidenza" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"etichetta" varchar NOT NULL,
  	"tipo" "enum_navigazione_in_evidenza_tipo" DEFAULT 'interno',
  	"pagina_id" integer,
  	"url" varchar
  );
  
  CREATE TABLE "navigazione_colonne_gruppi_voci" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"etichetta" varchar NOT NULL,
  	"tipo" "enum_navigazione_colonne_gruppi_voci_tipo" DEFAULT 'interno',
  	"pagina_id" integer,
  	"url" varchar
  );
  
  CREATE TABLE "navigazione_colonne_gruppi" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"titolo" varchar NOT NULL
  );
  
  CREATE TABLE "navigazione_colonne" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "navigazione_servizi_sinistra" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"etichetta" varchar NOT NULL,
  	"tipo" "enum_navigazione_servizi_sinistra_tipo" DEFAULT 'interno',
  	"pagina_id" integer,
  	"url" varchar
  );
  
  CREATE TABLE "navigazione_servizi_destra" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"etichetta" varchar NOT NULL,
  	"tipo" "enum_navigazione_servizi_destra_tipo" DEFAULT 'interno',
  	"pagina_id" integer,
  	"url" varchar
  );
  
  CREATE TABLE "navigazione_footer_link" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"etichetta" varchar NOT NULL,
  	"tipo" "enum_navigazione_footer_link_tipo" DEFAULT 'interno',
  	"pagina_id" integer,
  	"url" varchar
  );
  
  CREATE TABLE "navigazione_footer_social" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"etichetta" varchar NOT NULL,
  	"tipo" "enum_navigazione_footer_social_tipo" DEFAULT 'interno',
  	"pagina_id" integer,
  	"url" varchar
  );
  
  CREATE TABLE "navigazione_footer_legale" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"etichetta" varchar NOT NULL,
  	"tipo" "enum_navigazione_footer_legale_tipo" DEFAULT 'interno',
  	"pagina_id" integer,
  	"url" varchar
  );
  
  CREATE TABLE "navigazione" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  ALTER TABLE "navigazione_in_evidenza" ADD CONSTRAINT "navigazione_in_evidenza_pagina_id_pagine_id_fk" FOREIGN KEY ("pagina_id") REFERENCES "public"."pagine"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "navigazione_in_evidenza" ADD CONSTRAINT "navigazione_in_evidenza_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."navigazione"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "navigazione_colonne_gruppi_voci" ADD CONSTRAINT "navigazione_colonne_gruppi_voci_pagina_id_pagine_id_fk" FOREIGN KEY ("pagina_id") REFERENCES "public"."pagine"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "navigazione_colonne_gruppi_voci" ADD CONSTRAINT "navigazione_colonne_gruppi_voci_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."navigazione_colonne_gruppi"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "navigazione_colonne_gruppi" ADD CONSTRAINT "navigazione_colonne_gruppi_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."navigazione_colonne"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "navigazione_colonne" ADD CONSTRAINT "navigazione_colonne_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."navigazione"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "navigazione_servizi_sinistra" ADD CONSTRAINT "navigazione_servizi_sinistra_pagina_id_pagine_id_fk" FOREIGN KEY ("pagina_id") REFERENCES "public"."pagine"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "navigazione_servizi_sinistra" ADD CONSTRAINT "navigazione_servizi_sinistra_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."navigazione"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "navigazione_servizi_destra" ADD CONSTRAINT "navigazione_servizi_destra_pagina_id_pagine_id_fk" FOREIGN KEY ("pagina_id") REFERENCES "public"."pagine"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "navigazione_servizi_destra" ADD CONSTRAINT "navigazione_servizi_destra_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."navigazione"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "navigazione_footer_link" ADD CONSTRAINT "navigazione_footer_link_pagina_id_pagine_id_fk" FOREIGN KEY ("pagina_id") REFERENCES "public"."pagine"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "navigazione_footer_link" ADD CONSTRAINT "navigazione_footer_link_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."navigazione"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "navigazione_footer_social" ADD CONSTRAINT "navigazione_footer_social_pagina_id_pagine_id_fk" FOREIGN KEY ("pagina_id") REFERENCES "public"."pagine"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "navigazione_footer_social" ADD CONSTRAINT "navigazione_footer_social_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."navigazione"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "navigazione_footer_legale" ADD CONSTRAINT "navigazione_footer_legale_pagina_id_pagine_id_fk" FOREIGN KEY ("pagina_id") REFERENCES "public"."pagine"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "navigazione_footer_legale" ADD CONSTRAINT "navigazione_footer_legale_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."navigazione"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "navigazione_in_evidenza_order_idx" ON "navigazione_in_evidenza" USING btree ("_order");
  CREATE INDEX "navigazione_in_evidenza_parent_id_idx" ON "navigazione_in_evidenza" USING btree ("_parent_id");
  CREATE INDEX "navigazione_in_evidenza_pagina_idx" ON "navigazione_in_evidenza" USING btree ("pagina_id");
  CREATE INDEX "navigazione_colonne_gruppi_voci_order_idx" ON "navigazione_colonne_gruppi_voci" USING btree ("_order");
  CREATE INDEX "navigazione_colonne_gruppi_voci_parent_id_idx" ON "navigazione_colonne_gruppi_voci" USING btree ("_parent_id");
  CREATE INDEX "navigazione_colonne_gruppi_voci_pagina_idx" ON "navigazione_colonne_gruppi_voci" USING btree ("pagina_id");
  CREATE INDEX "navigazione_colonne_gruppi_order_idx" ON "navigazione_colonne_gruppi" USING btree ("_order");
  CREATE INDEX "navigazione_colonne_gruppi_parent_id_idx" ON "navigazione_colonne_gruppi" USING btree ("_parent_id");
  CREATE INDEX "navigazione_colonne_order_idx" ON "navigazione_colonne" USING btree ("_order");
  CREATE INDEX "navigazione_colonne_parent_id_idx" ON "navigazione_colonne" USING btree ("_parent_id");
  CREATE INDEX "navigazione_servizi_sinistra_order_idx" ON "navigazione_servizi_sinistra" USING btree ("_order");
  CREATE INDEX "navigazione_servizi_sinistra_parent_id_idx" ON "navigazione_servizi_sinistra" USING btree ("_parent_id");
  CREATE INDEX "navigazione_servizi_sinistra_pagina_idx" ON "navigazione_servizi_sinistra" USING btree ("pagina_id");
  CREATE INDEX "navigazione_servizi_destra_order_idx" ON "navigazione_servizi_destra" USING btree ("_order");
  CREATE INDEX "navigazione_servizi_destra_parent_id_idx" ON "navigazione_servizi_destra" USING btree ("_parent_id");
  CREATE INDEX "navigazione_servizi_destra_pagina_idx" ON "navigazione_servizi_destra" USING btree ("pagina_id");
  CREATE INDEX "navigazione_footer_link_order_idx" ON "navigazione_footer_link" USING btree ("_order");
  CREATE INDEX "navigazione_footer_link_parent_id_idx" ON "navigazione_footer_link" USING btree ("_parent_id");
  CREATE INDEX "navigazione_footer_link_pagina_idx" ON "navigazione_footer_link" USING btree ("pagina_id");
  CREATE INDEX "navigazione_footer_social_order_idx" ON "navigazione_footer_social" USING btree ("_order");
  CREATE INDEX "navigazione_footer_social_parent_id_idx" ON "navigazione_footer_social" USING btree ("_parent_id");
  CREATE INDEX "navigazione_footer_social_pagina_idx" ON "navigazione_footer_social" USING btree ("pagina_id");
  CREATE INDEX "navigazione_footer_legale_order_idx" ON "navigazione_footer_legale" USING btree ("_order");
  CREATE INDEX "navigazione_footer_legale_parent_id_idx" ON "navigazione_footer_legale" USING btree ("_parent_id");
  CREATE INDEX "navigazione_footer_legale_pagina_idx" ON "navigazione_footer_legale" USING btree ("pagina_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "navigazione_in_evidenza" CASCADE;
  DROP TABLE "navigazione_colonne_gruppi_voci" CASCADE;
  DROP TABLE "navigazione_colonne_gruppi" CASCADE;
  DROP TABLE "navigazione_colonne" CASCADE;
  DROP TABLE "navigazione_servizi_sinistra" CASCADE;
  DROP TABLE "navigazione_servizi_destra" CASCADE;
  DROP TABLE "navigazione_footer_link" CASCADE;
  DROP TABLE "navigazione_footer_social" CASCADE;
  DROP TABLE "navigazione_footer_legale" CASCADE;
  DROP TABLE "navigazione" CASCADE;
  ALTER TABLE "pagine_blocks_link_voci" ALTER COLUMN "tipo" SET DATA TYPE text;
  ALTER TABLE "pagine_blocks_link_voci" ALTER COLUMN "tipo" SET DEFAULT 'interno'::text;
  DROP TYPE "public"."enum_pagine_blocks_link_voci_tipo";
  CREATE TYPE "public"."enum_pagine_blocks_link_voci_tipo" AS ENUM('interno', 'esterno');
  ALTER TABLE "pagine_blocks_link_voci" ALTER COLUMN "tipo" SET DEFAULT 'interno'::"public"."enum_pagine_blocks_link_voci_tipo";
  ALTER TABLE "pagine_blocks_link_voci" ALTER COLUMN "tipo" SET DATA TYPE "public"."enum_pagine_blocks_link_voci_tipo" USING "tipo"::"public"."enum_pagine_blocks_link_voci_tipo";
  ALTER TABLE "_pagine_v_blocks_link_voci" ALTER COLUMN "tipo" SET DATA TYPE text;
  ALTER TABLE "_pagine_v_blocks_link_voci" ALTER COLUMN "tipo" SET DEFAULT 'interno'::text;
  DROP TYPE "public"."enum__pagine_v_blocks_link_voci_tipo";
  CREATE TYPE "public"."enum__pagine_v_blocks_link_voci_tipo" AS ENUM('interno', 'esterno');
  ALTER TABLE "_pagine_v_blocks_link_voci" ALTER COLUMN "tipo" SET DEFAULT 'interno'::"public"."enum__pagine_v_blocks_link_voci_tipo";
  ALTER TABLE "_pagine_v_blocks_link_voci" ALTER COLUMN "tipo" SET DATA TYPE "public"."enum__pagine_v_blocks_link_voci_tipo" USING "tipo"::"public"."enum__pagine_v_blocks_link_voci_tipo";
  DROP TYPE "public"."enum_navigazione_in_evidenza_tipo";
  DROP TYPE "public"."enum_navigazione_colonne_gruppi_voci_tipo";
  DROP TYPE "public"."enum_navigazione_servizi_sinistra_tipo";
  DROP TYPE "public"."enum_navigazione_servizi_destra_tipo";
  DROP TYPE "public"."enum_navigazione_footer_link_tipo";
  DROP TYPE "public"."enum_navigazione_footer_social_tipo";
  DROP TYPE "public"."enum_navigazione_footer_legale_tipo";`)
}
