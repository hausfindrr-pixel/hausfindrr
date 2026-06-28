-- Make Message.propertyId nullable to support admin direct messages
ALTER TABLE "messages" ALTER COLUMN "property_id" DROP NOT NULL;

-- Create announcements table
CREATE TABLE "announcements" (
  "id"          TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "sender_id"   TEXT NOT NULL,
  "target_role" TEXT NOT NULL,
  "content"     TEXT NOT NULL,
  "created_at"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "announcements_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "announcements"
  ADD CONSTRAINT "announcements_sender_id_fkey"
  FOREIGN KEY ("sender_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE INDEX "announcements_target_role_idx" ON "announcements"("target_role");
CREATE INDEX "announcements_created_at_idx"  ON "announcements"("created_at");

-- Create complaints table
CREATE TABLE "complaints" (
  "id"          TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "tenant_id"   TEXT NOT NULL,
  "landlord_id" TEXT,
  "property_id" TEXT,
  "type"        TEXT NOT NULL,
  "details"     TEXT,
  "context"     TEXT NOT NULL DEFAULT 'landlord',
  "status"      TEXT NOT NULL DEFAULT 'new',
  "created_at"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "complaints_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "complaints"
  ADD CONSTRAINT "complaints_tenant_id_fkey"
  FOREIGN KEY ("tenant_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "complaints"
  ADD CONSTRAINT "complaints_landlord_id_fkey"
  FOREIGN KEY ("landlord_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "complaints"
  ADD CONSTRAINT "complaints_property_id_fkey"
  FOREIGN KEY ("property_id") REFERENCES "properties"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "complaints_status_idx"     ON "complaints"("status");
CREATE INDEX "complaints_tenant_id_idx"  ON "complaints"("tenant_id");
CREATE INDEX "complaints_created_at_idx" ON "complaints"("created_at");
