-- Create data_requests table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_name = 'data_requests'
  ) THEN
    CREATE TABLE "data_requests" (
      "id"         TEXT NOT NULL,
      "user_id"    TEXT,
      "user_email" TEXT NOT NULL,
      "type"       TEXT NOT NULL,
      "status"     TEXT NOT NULL DEFAULT 'pending',
      "notes"      TEXT,
      "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "data_requests_pkey" PRIMARY KEY ("id")
    );

    CREATE INDEX "data_requests_status_idx" ON "data_requests"("status");
    CREATE INDEX "data_requests_user_id_idx" ON "data_requests"("user_id");

    ALTER TABLE "data_requests"
      ADD CONSTRAINT "data_requests_user_id_fkey"
      FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
