-- Add publicId, expiresAt, legalHold to landlord_id_documents and property_title_documents
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'landlord_id_documents' AND column_name = 'public_id'
  ) THEN
    ALTER TABLE "landlord_id_documents" ADD COLUMN "public_id" TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'landlord_id_documents' AND column_name = 'expires_at'
  ) THEN
    -- Default existing rows to 30 days from upload; new rows set explicitly
    ALTER TABLE "landlord_id_documents" ADD COLUMN "expires_at" TIMESTAMP(3) NOT NULL DEFAULT (NOW() + INTERVAL '30 days');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'landlord_id_documents' AND column_name = 'legal_hold'
  ) THEN
    ALTER TABLE "landlord_id_documents" ADD COLUMN "legal_hold" BOOLEAN NOT NULL DEFAULT FALSE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'property_title_documents' AND column_name = 'public_id'
  ) THEN
    ALTER TABLE "property_title_documents" ADD COLUMN "public_id" TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'property_title_documents' AND column_name = 'expires_at'
  ) THEN
    ALTER TABLE "property_title_documents" ADD COLUMN "expires_at" TIMESTAMP(3) NOT NULL DEFAULT (NOW() + INTERVAL '30 days');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'property_title_documents' AND column_name = 'legal_hold'
  ) THEN
    ALTER TABLE "property_title_documents" ADD COLUMN "legal_hold" BOOLEAN NOT NULL DEFAULT FALSE;
  END IF;
END $$;
