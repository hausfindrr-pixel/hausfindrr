-- Make bedrooms and bathrooms nullable (land/commercial don't need them)
ALTER TABLE "properties" ALTER COLUMN "bedrooms" DROP NOT NULL;
ALTER TABLE "properties" ALTER COLUMN "bathrooms" DROP NOT NULL;

-- Add metadata JSON column for type-specific fields
ALTER TABLE "properties" ADD COLUMN "metadata" JSONB;
