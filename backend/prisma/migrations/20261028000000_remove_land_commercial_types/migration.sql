-- Safely remove land/commercial/other property types
-- Handles all partial-run states so it is always safe to re-run

DO $$
BEGIN
  -- If a previous partial run left PropertyType_old behind, clean it up first
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'PropertyType_old') THEN
    DROP TYPE "PropertyType_old";
  END IF;

  -- Now migrate if PropertyType still contains the old values
  IF EXISTS (
    SELECT 1 FROM pg_enum
    WHERE enumlabel IN ('land', 'commercial', 'other')
    AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'PropertyType')
  ) THEN
    DELETE FROM "listings" WHERE "property_type"::text IN ('land', 'commercial', 'other');
    ALTER TYPE "PropertyType" RENAME TO "PropertyType_old";
    CREATE TYPE "PropertyType" AS ENUM ('house', 'apartment');
    ALTER TABLE "listings" ALTER COLUMN "property_type" TYPE "PropertyType" USING "property_type"::text::"PropertyType";
    DROP TYPE "PropertyType_old";
  END IF;
END $$;
