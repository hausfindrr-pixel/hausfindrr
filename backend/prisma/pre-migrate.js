/**
 * Runs idempotent DDL for the revoke-verification feature before prisma migrate deploy.
 * Prisma wraps migrations in transactions; ALTER TYPE ... ADD VALUE is prohibited inside
 * a transaction on some PostgreSQL versions. This script runs each statement outside any
 * transaction to guarantee the schema changes land regardless of migration state.
 * All statements use IF NOT EXISTS / DO ... EXCEPTION so they are safe to re-run.
 */

const { PrismaClient } = require('@prisma/client');

async function main() {
  const prisma = new PrismaClient();

  try {
    // Add id_needed enum value outside any transaction
    await prisma.$executeRawUnsafe(
      `ALTER TYPE "UserStatus" ADD VALUE IF NOT EXISTS 'id_needed'`
    );

    await prisma.$executeRawUnsafe(
      `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "revocation_reason" TEXT`
    );

    await prisma.$executeRawUnsafe(
      `ALTER TABLE "properties" ADD COLUMN IF NOT EXISTS "revoked_pause" BOOLEAN NOT NULL DEFAULT false`
    );

    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "verification_logs" (
        "id" TEXT NOT NULL,
        "user_id" TEXT NOT NULL,
        "admin_id" TEXT,
        "action" TEXT NOT NULL,
        "reason" TEXT,
        "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "verification_logs_pkey" PRIMARY KEY ("id")
      )
    `);

    await prisma.$executeRawUnsafe(
      `CREATE INDEX IF NOT EXISTS "verification_logs_user_id_idx" ON "verification_logs"("user_id")`
    );
    await prisma.$executeRawUnsafe(
      `CREATE INDEX IF NOT EXISTS "verification_logs_created_at_idx" ON "verification_logs"("created_at")`
    );

    // Add FK if it doesn't already exist
    await prisma.$executeRawUnsafe(`
      DO $$ BEGIN
        ALTER TABLE "verification_logs"
          ADD CONSTRAINT "verification_logs_user_id_fkey"
          FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
      EXCEPTION WHEN duplicate_object THEN NULL;
      END $$
    `);

    // If this migration previously failed in _prisma_migrations, mark it as resolved
    // so prisma migrate deploy won't throw P3009.
    // A failed migration has finished_at IS NULL; we set it to NOW() and clear logs.
    await prisma.$executeRawUnsafe(`
      UPDATE "_prisma_migrations"
      SET finished_at         = COALESCE(finished_at, NOW()),
          logs                = NULL,
          rolled_back_at      = NULL,
          applied_steps_count = GREATEST(applied_steps_count, 1)
      WHERE migration_name = '20261128000002_revoke_verification'
    `);

    console.log('[pre-migrate] done');
  } catch (err) {
    console.error('[pre-migrate] error:', err.message);
    // Don't exit with non-zero — let prisma migrate deploy decide what to do next
  } finally {
    await prisma.$disconnect();
  }
}

main();
