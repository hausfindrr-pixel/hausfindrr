-- Safely remove land/commercial/other property types
-- Uses conditional logic so it's safe to re-run

DO $$
BEGIN
  -- Delete listings only if the enum values still exist
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
