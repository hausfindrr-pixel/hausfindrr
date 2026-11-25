-- Add draft and rented values to PropertyStatus enum (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum
    WHERE enumtypid = 'public."PropertyStatus"'::regtype
      AND enumlabel = 'draft'
  ) THEN
    ALTER TYPE "PropertyStatus" ADD VALUE 'draft' BEFORE 'pending';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_enum
    WHERE enumtypid = 'public."PropertyStatus"'::regtype
      AND enumlabel = 'rented'
  ) THEN
    ALTER TYPE "PropertyStatus" ADD VALUE 'rented';
  END IF;
END $$;
