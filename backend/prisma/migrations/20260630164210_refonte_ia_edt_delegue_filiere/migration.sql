/*
  Warnings:

  - You are about to drop the column `niveau` on the `etudiant` table. All the data in the column will be lost.
  - You are about to drop the column `niveau` on the `inscription` table. All the data in the column will be lost.
  - You are about to drop the `seance` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `cloudinary_public_id` to the `emploi_du_temps` table without a default value. This is not possible if the table is not empty.
  - Added the required column `cloudinary_url` to the `emploi_du_temps` table without a default value. This is not possible if the table is not empty.
  - Added the required column `format` to the `emploi_du_temps` table without a default value. This is not possible if the table is not empty.
  - Added the required column `niveau` to the `filiere` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "format_document_personnel" AS ENUM ('PDF', 'PPTX', 'DOCX', 'IMAGE');

-- DropForeignKey
ALTER TABLE "seance" DROP CONSTRAINT "seance_emploi_du_temps_id_fkey";

-- DropForeignKey
ALTER TABLE "seance" DROP CONSTRAINT "seance_enseignant_id_fkey";

-- DropForeignKey
ALTER TABLE "seance" DROP CONSTRAINT "seance_matiere_id_fkey";

-- DropForeignKey
ALTER TABLE "seance" DROP CONSTRAINT "seance_salle_id_fkey";

-- DropIndex
DROP INDEX "document_chunk_embedding_hnsw_idx";

-- AlterTable
ALTER TABLE "annonce" ADD COLUMN     "fichier_format" TEXT,
ADD COLUMN     "fichier_nom_original" TEXT,
ADD COLUMN     "fichier_public_id" TEXT,
ADD COLUMN     "fichier_taille_octets" INTEGER,
ADD COLUMN     "fichier_url" TEXT;

-- AlterTable
ALTER TABLE "emploi_du_temps" ADD COLUMN     "cloudinary_public_id" TEXT NOT NULL,
ADD COLUMN     "cloudinary_url" TEXT NOT NULL,
ADD COLUMN     "format" TEXT NOT NULL,
ADD COLUMN     "titre" TEXT;

-- AlterTable
ALTER TABLE "etudiant" DROP COLUMN "niveau",
ADD COLUMN     "est_delegue" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "fiche_revision" ADD COLUMN     "document_personnel_id" TEXT;

-- AlterTable
ALTER TABLE "filiere" ADD COLUMN     "niveau" TEXT NOT NULL,
ADD COLUMN     "salle_attitree_id" TEXT;

-- AlterTable
ALTER TABLE "inscription" DROP COLUMN "niveau";

-- DropTable
DROP TABLE "seance";

-- DropEnum
DROP TYPE "jour_semaine";

-- DropEnum
DROP TYPE "type_seance";

-- CreateTable
CREATE TABLE "document_personnel" (
    "id" TEXT NOT NULL,
    "etudiant_id" TEXT NOT NULL,
    "titre" TEXT NOT NULL,
    "nom_fichier" TEXT NOT NULL,
    "format" "format_document_personnel" NOT NULL,
    "taille_octets" INTEGER NOT NULL,
    "cloudinary_public_id" TEXT NOT NULL,
    "cloudinary_url" TEXT NOT NULL,
    "statut_indexation" "statut_indexation" NOT NULL DEFAULT 'NON_INDEXE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "document_personnel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "document_personnel_chunk" (
    "id" TEXT NOT NULL,
    "document_personnel_id" TEXT NOT NULL,
    "contenu_texte" TEXT NOT NULL,
    "position_index" INTEGER NOT NULL,
    "embedding" vector(384),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "document_personnel_chunk_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "document_personnel_etudiant_id_idx" ON "document_personnel"("etudiant_id");

-- CreateIndex
CREATE INDEX "document_personnel_chunk_document_personnel_id_idx" ON "document_personnel_chunk"("document_personnel_id");

-- AddForeignKey
ALTER TABLE "filiere" ADD CONSTRAINT "filiere_salle_attitree_id_fkey" FOREIGN KEY ("salle_attitree_id") REFERENCES "salle"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_personnel" ADD CONSTRAINT "document_personnel_etudiant_id_fkey" FOREIGN KEY ("etudiant_id") REFERENCES "etudiant"("utilisateur_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_personnel_chunk" ADD CONSTRAINT "document_personnel_chunk_document_personnel_id_fkey" FOREIGN KEY ("document_personnel_id") REFERENCES "document_personnel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fiche_revision" ADD CONSTRAINT "fiche_revision_document_personnel_id_fkey" FOREIGN KEY ("document_personnel_id") REFERENCES "document_personnel"("id") ON DELETE SET NULL ON UPDATE CASCADE;
