-- Immutable consent log table.
-- userId is nullable (SetNull on user deletion) so rows survive account closure.
-- No UPDATE or DELETE operations should ever be run against this table.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables WHERE table_name = 'consent_logs'
  ) THEN
    CREATE TABLE "consent_logs" (
      "id"           TEXT         NOT NULL,
      "user_id"      TEXT,
      "user_email"   TEXT         NOT NULL,
      "user_role"    TEXT         NOT NULL,
      "document"     TEXT         NOT NULL,
      "version"      TEXT         NOT NULL,
      "accepted"     BOOLEAN      NOT NULL DEFAULT TRUE,
      "accepted_at"  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
      "ip_address"   TEXT         NOT NULL,
      "user_agent"   TEXT         NOT NULL,

      CONSTRAINT "consent_logs_pkey" PRIMARY KEY ("id"),
      CONSTRAINT "consent_logs_user_id_fkey"
        FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL
    );

    CREATE INDEX "consent_logs_user_id_idx"    ON "consent_logs"("user_id");
    CREATE INDEX "consent_logs_user_email_idx" ON "consent_logs"("user_email");
    CREATE INDEX "consent_logs_document_idx"   ON "consent_logs"("document");
    CREATE INDEX "consent_logs_accepted_at_idx" ON "consent_logs"("accepted_at");
  END IF;
END $$;
