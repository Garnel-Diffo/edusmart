/*
  Warnings:

  - Added the required column `cloudinary_version` to the `cours_document` table without a default value. This is not possible if the table is not empty.
  - Added the required column `cloudinary_version` to the `document_personnel` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "cours_document" ADD COLUMN     "cloudinary_version" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "document_personnel" ADD COLUMN     "cloudinary_version" INTEGER NOT NULL;
