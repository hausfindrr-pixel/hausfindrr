-- AlterTable
ALTER TABLE "users" ADD COLUMN "terms_accepted" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "users" ADD COLUMN "terms_accepted_at" TIMESTAMPTZ;
ALTER TABLE "users" ADD COLUMN "terms_accepted_ip" TEXT;
