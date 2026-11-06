import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TYPE "public"."enum_pagine_uffici_editori" ADD VALUE 'biblioteca';
  ALTER TYPE "public"."enum__pagine_v_version_uffici_editori" ADD VALUE 'biblioteca';
  ALTER TYPE "public"."enum_avvisi_categorie" ADD VALUE 'biblioteca';
  ALTER TYPE "public"."enum__avvisi_v_version_categorie" ADD VALUE 'biblioteca';
  ALTER TYPE "public"."enum_users_roles" ADD VALUE 'biblioteca' BEFORE 'docente';`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "pagine_uffici_editori" ALTER COLUMN "value" SET DATA TYPE text;
  DROP TYPE "public"."enum_pagine_uffici_editori";
  CREATE TYPE "public"."enum_pagine_uffici_editori" AS ENUM('segreteria', 'amministrativo', 'erasmus');
  ALTER TABLE "pagine_uffici_editori" ALTER COLUMN "value" SET DATA TYPE "public"."enum_pagine_uffici_editori" USING "value"::"public"."enum_pagine_uffici_editori";
  ALTER TABLE "_pagine_v_version_uffici_editori" ALTER COLUMN "value" SET DATA TYPE text;
  DROP TYPE "public"."enum__pagine_v_version_uffici_editori";
  CREATE TYPE "public"."enum__pagine_v_version_uffici_editori" AS ENUM('segreteria', 'amministrativo', 'erasmus');
  ALTER TABLE "_pagine_v_version_uffici_editori" ALTER COLUMN "value" SET DATA TYPE "public"."enum__pagine_v_version_uffici_editori" USING "value"::"public"."enum__pagine_v_version_uffici_editori";
  ALTER TABLE "avvisi_categorie" ALTER COLUMN "value" SET DATA TYPE text;
  DROP TYPE "public"."enum_avvisi_categorie";
  CREATE TYPE "public"."enum_avvisi_categorie" AS ENUM('in-evidenza', 'generali', 'lezioni', 'esami', 'eventi', 'bandi-e-concorsi', 'iscrizioni', 'coordinatori', 'tasse');
  ALTER TABLE "avvisi_categorie" ALTER COLUMN "value" SET DATA TYPE "public"."enum_avvisi_categorie" USING "value"::"public"."enum_avvisi_categorie";
  ALTER TABLE "_avvisi_v_version_categorie" ALTER COLUMN "value" SET DATA TYPE text;
  DROP TYPE "public"."enum__avvisi_v_version_categorie";
  CREATE TYPE "public"."enum__avvisi_v_version_categorie" AS ENUM('in-evidenza', 'generali', 'lezioni', 'esami', 'eventi', 'bandi-e-concorsi', 'iscrizioni', 'coordinatori', 'tasse');
  ALTER TABLE "_avvisi_v_version_categorie" ALTER COLUMN "value" SET DATA TYPE "public"."enum__avvisi_v_version_categorie" USING "value"::"public"."enum__avvisi_v_version_categorie";
  ALTER TABLE "users_roles" ALTER COLUMN "value" SET DATA TYPE text;
  DROP TYPE "public"."enum_users_roles";
  CREATE TYPE "public"."enum_users_roles" AS ENUM('admin', 'vicedirezione', 'redazione', 'segreteria', 'amministrativo', 'erasmus', 'docente', 'dottorando', 'studente');
  ALTER TABLE "users_roles" ALTER COLUMN "value" SET DATA TYPE "public"."enum_users_roles" USING "value"::"public"."enum_users_roles";`)
}
