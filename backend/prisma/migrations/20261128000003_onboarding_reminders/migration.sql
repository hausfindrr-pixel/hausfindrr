-- Migration: 20261128000003_onboarding_reminders
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "first_verified_at" TIMESTAMP(3);
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "id_reminder_count" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "id_reminder_sent_at" TIMESTAMP(3);
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "listing_reminder_count" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "listing_reminder_sent_at" TIMESTAMP(3);
ALTER TABLE "notification_settings" ADD COLUMN IF NOT EXISTS "setup_reminders" BOOLEAN NOT NULL DEFAULT true;
