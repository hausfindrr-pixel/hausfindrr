-- Add rejection_reason to users table
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "rejection_reason" TEXT;
