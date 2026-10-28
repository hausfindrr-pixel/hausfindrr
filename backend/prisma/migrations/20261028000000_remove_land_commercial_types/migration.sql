-- Delete any listings with property types being removed
DELETE FROM "listings" WHERE "property_type" IN ('land', 'commercial', 'other');

-- Recreate the enum without land, commercial, other
ALTER TYPE "PropertyType" RENAME TO "PropertyType_old";
CREATE TYPE "PropertyType" AS ENUM ('house', 'apartment');
ALTER TABLE "listings" ALTER COLUMN "property_type" TYPE "PropertyType" USING "property_type"::text::"PropertyType";
DROP TYPE "PropertyType_old";
