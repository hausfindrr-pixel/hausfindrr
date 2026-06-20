/*
  Warnings:

  - You are about to drop the `landlord_documents` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "IdDocType" AS ENUM ('passport', 'drivers_licence', 'nid');

-- CreateEnum
CREATE TYPE "TitleDocType" AS ENUM ('title', 'other');

-- DropForeignKey
ALTER TABLE "landlord_documents" DROP CONSTRAINT "landlord_documents_user_id_fkey";

-- AlterTable
ALTER TABLE "properties" ADD COLUMN     "location_lat" DOUBLE PRECISION,
ADD COLUMN     "location_lng" DOUBLE PRECISION;

-- DropTable
DROP TABLE "landlord_documents";

-- DropEnum
DROP TYPE "DocType";

-- CreateTable
CREATE TABLE "landlord_id_documents" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "doc_type" "IdDocType" NOT NULL,
    "file_path" TEXT NOT NULL,
    "uploaded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "landlord_id_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "property_title_documents" (
    "id" TEXT NOT NULL,
    "property_id" TEXT NOT NULL,
    "doc_type" "TitleDocType" NOT NULL,
    "file_path" TEXT NOT NULL,
    "uploaded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "property_title_documents_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "landlord_id_documents" ADD CONSTRAINT "landlord_id_documents_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "property_title_documents" ADD CONSTRAINT "property_title_documents_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "properties"("id") ON DELETE CASCADE ON UPDATE CASCADE;
