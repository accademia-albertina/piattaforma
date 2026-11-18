import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_home_accessi_icona" AS ENUM('ammissioni', 'laurea', 'calendario', 'segreteria', 'libro', 'persone', 'documento', 'luogo', 'email', 'info');
  CREATE TYPE "public"."enum_home_accessi_tipo" AS ENUM('interno', 'percorso', 'esterno');
  CREATE TABLE "home_accessi" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"titolo" varchar NOT NULL,
  	"testo" varchar NOT NULL,
  	"icona" "enum_home_accessi_icona" DEFAULT 'info' NOT NULL,
  	"tipo" "enum_home_accessi_tipo" DEFAULT 'interno',
  	"pagina_id" integer,
  	"url" varchar
  );
  
  CREATE TABLE "home_cifre" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"valore" numeric NOT NULL,
  	"etichetta" varchar NOT NULL
  );
  
  CREATE TABLE "home" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"slider_numero" numeric DEFAULT 5,
  	"accessi_titolo" varchar DEFAULT 'Da dove vuoi iniziare?',
  	"accessi_testo" varchar DEFAULT 'Accademia Albertina di Belle Arti di Torino: Lauree e Lauree magistrali in arti visive, progettazione e nuove tecnologie.',
  	"manifesto" varchar DEFAULT 'Dal 1678 Torino ha la sua scuola d’arte. Dieci scuole, dalla pittura al cinema, dalla scultura alle nuove tecnologie. Un palazzo nel centro della città, una pinacoteca, i laboratori. Qui si impara un mestiere antico e si cerca la propria stella.',
  	"foto_grande_id" integer,
  	"scuole_titolo" varchar DEFAULT 'Laurea e Laurea magistrale',
  	"scuole_testo" varchar DEFAULT 'Lauree e Lauree magistrali con lo stesso valore di quelle universitarie.',
  	"avviso_mostra" boolean DEFAULT true,
  	"avviso_titolo" varchar DEFAULT 'Sito in costruzione',
  	"avviso_testo" varchar DEFAULT 'Il sito ufficiale resta albertina-academy.it fino al passaggio alla nuova piattaforma.',
  	"tour_titolo" varchar DEFAULT 'Esplora l’Accademia',
  	"tour_testo" varchar DEFAULT 'Entra nelle aule, nei laboratori e negli spazi storici di via Accademia Albertina, da dove vuoi.',
  	"tour_url" varchar DEFAULT 'https://tour.albertina-academy.it/',
  	"tour_foto_id" integer,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "home_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"media_id" integer
  );
  
  ALTER TABLE "home_accessi" ADD CONSTRAINT "home_accessi_pagina_id_pagine_id_fk" FOREIGN KEY ("pagina_id") REFERENCES "public"."pagine"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "home_accessi" ADD CONSTRAINT "home_accessi_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."home"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "home_cifre" ADD CONSTRAINT "home_cifre_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."home"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "home" ADD CONSTRAINT "home_foto_grande_id_media_id_fk" FOREIGN KEY ("foto_grande_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "home" ADD CONSTRAINT "home_tour_foto_id_media_id_fk" FOREIGN KEY ("tour_foto_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "home_rels" ADD CONSTRAINT "home_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."home"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "home_rels" ADD CONSTRAINT "home_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "home_accessi_order_idx" ON "home_accessi" USING btree ("_order");
  CREATE INDEX "home_accessi_parent_id_idx" ON "home_accessi" USING btree ("_parent_id");
  CREATE INDEX "home_accessi_pagina_idx" ON "home_accessi" USING btree ("pagina_id");
  CREATE INDEX "home_cifre_order_idx" ON "home_cifre" USING btree ("_order");
  CREATE INDEX "home_cifre_parent_id_idx" ON "home_cifre" USING btree ("_parent_id");
  CREATE INDEX "home_foto_grande_idx" ON "home" USING btree ("foto_grande_id");
  CREATE INDEX "home_tour_foto_idx" ON "home" USING btree ("tour_foto_id");
  CREATE INDEX "home_rels_order_idx" ON "home_rels" USING btree ("order");
  CREATE INDEX "home_rels_parent_idx" ON "home_rels" USING btree ("parent_id");
  CREATE INDEX "home_rels_path_idx" ON "home_rels" USING btree ("path");
  CREATE INDEX "home_rels_media_id_idx" ON "home_rels" USING btree ("media_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "home_accessi" CASCADE;
  DROP TABLE "home_cifre" CASCADE;
  DROP TABLE "home" CASCADE;
  DROP TABLE "home_rels" CASCADE;
  DROP TYPE "public"."enum_home_accessi_icona";
  DROP TYPE "public"."enum_home_accessi_tipo";`)
}
