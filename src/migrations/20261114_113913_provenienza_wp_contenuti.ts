import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "avvisi" ADD COLUMN "wp_id" varchar;
  ALTER TABLE "avvisi" ADD COLUMN "wp_modificato" varchar;
  ALTER TABLE "avvisi" ADD COLUMN "wp_impronta" varchar;
  ALTER TABLE "avvisi" ADD COLUMN "modificato_nel_pannello" boolean DEFAULT false;
  ALTER TABLE "_avvisi_v" ADD COLUMN "version_wp_id" varchar;
  ALTER TABLE "_avvisi_v" ADD COLUMN "version_wp_modificato" varchar;
  ALTER TABLE "_avvisi_v" ADD COLUMN "version_wp_impronta" varchar;
  ALTER TABLE "_avvisi_v" ADD COLUMN "version_modificato_nel_pannello" boolean DEFAULT false;
  ALTER TABLE "albo" ADD COLUMN "wp_id" varchar;
  ALTER TABLE "albo" ADD COLUMN "wp_modificato" varchar;
  ALTER TABLE "albo" ADD COLUMN "wp_impronta" varchar;
  ALTER TABLE "albo" ADD COLUMN "modificato_nel_pannello" boolean DEFAULT false;
  ALTER TABLE "_albo_v" ADD COLUMN "version_wp_id" varchar;
  ALTER TABLE "_albo_v" ADD COLUMN "version_wp_modificato" varchar;
  ALTER TABLE "_albo_v" ADD COLUMN "version_wp_impronta" varchar;
  ALTER TABLE "_albo_v" ADD COLUMN "version_modificato_nel_pannello" boolean DEFAULT false;
  ALTER TABLE "trasparenza" ADD COLUMN "wp_id" varchar;
  ALTER TABLE "trasparenza" ADD COLUMN "wp_modificato" varchar;
  ALTER TABLE "trasparenza" ADD COLUMN "wp_impronta" varchar;
  ALTER TABLE "trasparenza" ADD COLUMN "modificato_nel_pannello" boolean DEFAULT false;
  ALTER TABLE "_trasparenza_v" ADD COLUMN "version_wp_id" varchar;
  ALTER TABLE "_trasparenza_v" ADD COLUMN "version_wp_modificato" varchar;
  ALTER TABLE "_trasparenza_v" ADD COLUMN "version_wp_impronta" varchar;
  ALTER TABLE "_trasparenza_v" ADD COLUMN "version_modificato_nel_pannello" boolean DEFAULT false;
  CREATE UNIQUE INDEX "avvisi_wp_id_idx" ON "avvisi" USING btree ("wp_id");
  CREATE INDEX "_avvisi_v_version_version_wp_id_idx" ON "_avvisi_v" USING btree ("version_wp_id");
  CREATE UNIQUE INDEX "albo_wp_id_idx" ON "albo" USING btree ("wp_id");
  CREATE INDEX "_albo_v_version_version_wp_id_idx" ON "_albo_v" USING btree ("version_wp_id");
  CREATE UNIQUE INDEX "trasparenza_wp_id_idx" ON "trasparenza" USING btree ("wp_id");
  CREATE INDEX "_trasparenza_v_version_version_wp_id_idx" ON "_trasparenza_v" USING btree ("version_wp_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP INDEX "avvisi_wp_id_idx";
  DROP INDEX "_avvisi_v_version_version_wp_id_idx";
  DROP INDEX "albo_wp_id_idx";
  DROP INDEX "_albo_v_version_version_wp_id_idx";
  DROP INDEX "trasparenza_wp_id_idx";
  DROP INDEX "_trasparenza_v_version_version_wp_id_idx";
  ALTER TABLE "avvisi" DROP COLUMN "wp_id";
  ALTER TABLE "avvisi" DROP COLUMN "wp_modificato";
  ALTER TABLE "avvisi" DROP COLUMN "wp_impronta";
  ALTER TABLE "avvisi" DROP COLUMN "modificato_nel_pannello";
  ALTER TABLE "_avvisi_v" DROP COLUMN "version_wp_id";
  ALTER TABLE "_avvisi_v" DROP COLUMN "version_wp_modificato";
  ALTER TABLE "_avvisi_v" DROP COLUMN "version_wp_impronta";
  ALTER TABLE "_avvisi_v" DROP COLUMN "version_modificato_nel_pannello";
  ALTER TABLE "albo" DROP COLUMN "wp_id";
  ALTER TABLE "albo" DROP COLUMN "wp_modificato";
  ALTER TABLE "albo" DROP COLUMN "wp_impronta";
  ALTER TABLE "albo" DROP COLUMN "modificato_nel_pannello";
  ALTER TABLE "_albo_v" DROP COLUMN "version_wp_id";
  ALTER TABLE "_albo_v" DROP COLUMN "version_wp_modificato";
  ALTER TABLE "_albo_v" DROP COLUMN "version_wp_impronta";
  ALTER TABLE "_albo_v" DROP COLUMN "version_modificato_nel_pannello";
  ALTER TABLE "trasparenza" DROP COLUMN "wp_id";
  ALTER TABLE "trasparenza" DROP COLUMN "wp_modificato";
  ALTER TABLE "trasparenza" DROP COLUMN "wp_impronta";
  ALTER TABLE "trasparenza" DROP COLUMN "modificato_nel_pannello";
  ALTER TABLE "_trasparenza_v" DROP COLUMN "version_wp_id";
  ALTER TABLE "_trasparenza_v" DROP COLUMN "version_wp_modificato";
  ALTER TABLE "_trasparenza_v" DROP COLUMN "version_wp_impronta";
  ALTER TABLE "_trasparenza_v" DROP COLUMN "version_modificato_nel_pannello";`)
}
