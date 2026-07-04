-- Make password_hash nullable (Google OAuth users have no password)
ALTER TABLE "users" ALTER COLUMN "password_hash" DROP NOT NULL;

-- Add Google OAuth ID column
ALTER TABLE "users" ADD COLUMN "google_id" TEXT;
ALTER TABLE "users" ADD CONSTRAINT "users_google_id_key" UNIQUE ("google_id");
