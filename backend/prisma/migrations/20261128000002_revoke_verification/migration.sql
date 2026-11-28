-- Add id_needed to UserStatus enum
ALTER TYPE "UserStatus" ADD VALUE IF NOT EXISTS 'id_needed';

-- Add revocation_reason to users
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "revocation_reason" TEXT;

-- Add revoked_pause to properties
ALTER TABLE "properties" ADD COLUMN IF NOT EXISTS "revoked_pause" BOOLEAN NOT NULL DEFAULT false;

-- Create verification_logs table
CREATE TABLE IF NOT EXISTS "verification_logs" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "admin_id" TEXT,
    "action" TEXT NOT NULL,
    "reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "verification_logs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "verification_logs_user_id_idx" ON "verification_logs"("user_id");
CREATE INDEX IF NOT EXISTS "verification_logs_created_at_idx" ON "verification_logs"("created_at");

ALTER TABLE "verification_logs"
    ADD CONSTRAINT "verification_logs_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
