-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "vector";

-- CreateEnum
CREATE TYPE "role_utilisateur" AS ENUM ('ETUDIANT', 'ENSEIGNANT', 'ADMIN_SCOLAIRE', 'DIRECTION', 'SUPER_ADMIN');

-- CreateEnum
CREATE TYPE "statut_compte" AS ENUM ('ACTIF', 'DESACTIVE', 'VERROUILLE');

-- CreateEnum
CREATE TYPE "format_document" AS ENUM ('PDF', 'PPTX', 'DOCX');

-- CreateEnum
CREATE TYPE "statut_indexation" AS ENUM ('NON_INDEXE', 'EN_COURS', 'INDEXE', 'ERREUR');

-- CreateEnum
CREATE TYPE "type_evaluation" AS ENUM ('CONTROLE', 'EXAMEN', 'TP', 'PROJET');

-- CreateEnum
CREATE TYPE "cible_annonce" AS ENUM ('TOUS', 'FILIERE', 'MODULE', 'ETUDIANT');

-- CreateEnum
CREATE TYPE "type_fiche_ia" AS ENUM ('FICHE_RESUME', 'RESUME_DETAILLE', 'QUIZ_QCM');

-- CreateEnum
CREATE TYPE "type_salle" AS ENUM ('AMPHITHEATRE', 'LABO', 'SALLE_COURS');

-- CreateEnum
CREATE TYPE "mention" AS ENUM ('EXCELLENT', 'TRES_BIEN', 'BIEN', 'ASSEZ_BIEN', 'PASSABLE', 'AJOURNE');

-- CreateEnum
CREATE TYPE "jour_semaine" AS ENUM ('LUNDI', 'MARDI', 'MERCREDI', 'JEUDI', 'VENDREDI', 'SAMEDI', 'DIMANCHE');

-- CreateEnum
CREATE TYPE "type_seance" AS ENUM ('COURS', 'TD', 'TP');

-- CreateEnum
CREATE TYPE "canal_notification" AS ENUM ('IN_APP', 'EMAIL', 'PUSH');

-- CreateEnum
CREATE TYPE "type_interaction_ia" AS ENUM ('CHAT', 'RECHERCHE', 'FICHE');

-- CreateEnum
CREATE TYPE "statut_fiche" AS ENUM ('EN_COURS', 'PRET', 'ECHEC');

-- CreateTable
CREATE TABLE "utilisateur" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "mot_de_passe_hash" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "prenom" TEXT NOT NULL,
    "role" "role_utilisateur" NOT NULL,
    "telephone" TEXT,
    "avatar_url" TEXT,
    "statut_compte" "statut_compte" NOT NULL DEFAULT 'ACTIF',
    "tentatives_echouees" INTEGER NOT NULL DEFAULT 0,
    "verrouille_jusqu_a" TIMESTAMP(3),
    "email_verifie" BOOLEAN NOT NULL DEFAULT false,
    "derniere_connexion" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "utilisateur_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "etudiant" (
    "utilisateur_id" TEXT NOT NULL,
    "matricule" TEXT NOT NULL,
    "niveau" TEXT NOT NULL,
    "annee_entree" INTEGER NOT NULL,

    CONSTRAINT "etudiant_pkey" PRIMARY KEY ("utilisateur_id")
);

-- CreateTable
CREATE TABLE "enseignant" (
    "utilisateur_id" TEXT NOT NULL,
    "specialite" TEXT,
    "grade" TEXT,

    CONSTRAINT "enseignant_pkey" PRIMARY KEY ("utilisateur_id")
);

-- CreateTable
CREATE TABLE "admin_scolaire" (
    "utilisateur_id" TEXT NOT NULL,
    "fonction" TEXT,
    "super_admin" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "admin_scolaire_pkey" PRIMARY KEY ("utilisateur_id")
);

-- CreateTable
CREATE TABLE "refresh_token" (
    "id" TEXT NOT NULL,
    "utilisateur_id" TEXT NOT NULL,
    "token_hash" TEXT NOT NULL,
    "user_agent" TEXT,
    "ip" TEXT,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "revoked" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "refresh_token_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "filiere" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "cycle" TEXT NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "filiere_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "module" (
    "id" TEXT NOT NULL,
    "filiere_id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "semestre" INTEGER NOT NULL,
    "credits_ects" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "module_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "matiere" (
    "id" TEXT NOT NULL,
    "module_id" TEXT NOT NULL,
    "enseignant_id" TEXT,
    "nom" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "coefficient" DECIMAL(4,2) NOT NULL DEFAULT 1,
    "credits_ects" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "matiere_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inscription" (
    "id" TEXT NOT NULL,
    "etudiant_id" TEXT NOT NULL,
    "filiere_id" TEXT NOT NULL,
    "annee_scolaire" TEXT NOT NULL,
    "niveau" TEXT NOT NULL,
    "statut" TEXT NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "inscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "salle" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "capacite" INTEGER NOT NULL,
    "type" "type_salle" NOT NULL,
    "batiment" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "salle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "emploi_du_temps" (
    "id" TEXT NOT NULL,
    "filiere_id" TEXT NOT NULL,
    "semestre" INTEGER NOT NULL,
    "annee_scolaire" TEXT NOT NULL,
    "created_by_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "emploi_du_temps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "seance" (
    "id" TEXT NOT NULL,
    "emploi_du_temps_id" TEXT NOT NULL,
    "matiere_id" TEXT NOT NULL,
    "salle_id" TEXT NOT NULL,
    "enseignant_id" TEXT NOT NULL,
    "jour_semaine" "jour_semaine" NOT NULL,
    "heure_debut" TEXT NOT NULL,
    "heure_fin" TEXT NOT NULL,
    "type_seance" "type_seance" NOT NULL DEFAULT 'COURS',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "seance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cours_document" (
    "id" TEXT NOT NULL,
    "matiere_id" TEXT NOT NULL,
    "enseignant_id" TEXT NOT NULL,
    "titre" TEXT NOT NULL,
    "nom_fichier" TEXT NOT NULL,
    "format" "format_document" NOT NULL,
    "taille_octets" INTEGER NOT NULL,
    "cloudinary_public_id" TEXT NOT NULL,
    "cloudinary_url" TEXT NOT NULL,
    "statut_indexation" "statut_indexation" NOT NULL DEFAULT 'NON_INDEXE',
    "date_depot" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "nb_telechargements" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cours_document_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "document_chunk" (
    "id" TEXT NOT NULL,
    "cours_document_id" TEXT NOT NULL,
    "contenu_texte" TEXT NOT NULL,
    "position_index" INTEGER NOT NULL,
    "embedding" vector(384),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "document_chunk_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "telechargement_log" (
    "id" TEXT NOT NULL,
    "cours_document_id" TEXT NOT NULL,
    "etudiant_id" TEXT NOT NULL,
    "ip" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "telechargement_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "note" (
    "id" TEXT NOT NULL,
    "etudiant_id" TEXT NOT NULL,
    "matiere_id" TEXT NOT NULL,
    "type_evaluation" "type_evaluation" NOT NULL,
    "valeur" DECIMAL(4,2) NOT NULL,
    "coefficient_evaluation" DECIMAL(4,2) NOT NULL DEFAULT 1,
    "semestre" INTEGER NOT NULL,
    "annee_scolaire" TEXT NOT NULL,
    "est_valide" BOOLEAN NOT NULL DEFAULT false,
    "saisie_par_id" TEXT NOT NULL,
    "valide_par_id" TEXT,
    "date_saisie" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "date_validation" TIMESTAMP(3),
    "commentaire_refus" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "note_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bulletin_semestre" (
    "id" TEXT NOT NULL,
    "etudiant_id" TEXT NOT NULL,
    "semestre" INTEGER NOT NULL,
    "annee_scolaire" TEXT NOT NULL,
    "moyenne_generale" DECIMAL(5,2) NOT NULL,
    "rang" INTEGER,
    "mention" "mention" NOT NULL,
    "pdf_cloudinary_url" TEXT,
    "genere_le" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "genere_par_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bulletin_semestre_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pv_deliberation" (
    "id" TEXT NOT NULL,
    "filiere_id" TEXT NOT NULL,
    "niveau" TEXT NOT NULL,
    "semestre" INTEGER NOT NULL,
    "annee_scolaire" TEXT NOT NULL,
    "pdf_cloudinary_url" TEXT,
    "decisions_json" JSONB NOT NULL,
    "genere_le" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "genere_par_id" TEXT NOT NULL,
    "archive_jusqu_a" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pv_deliberation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "annonce" (
    "id" TEXT NOT NULL,
    "auteur_id" TEXT NOT NULL,
    "titre" TEXT NOT NULL,
    "contenu" TEXT NOT NULL,
    "cible" "cible_annonce" NOT NULL,
    "filiere_id" TEXT,
    "module_id" TEXT,
    "etudiant_cible_id" TEXT,
    "date_publication" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "annonce_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification" (
    "id" TEXT NOT NULL,
    "destinataire_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "titre" TEXT NOT NULL,
    "contenu" TEXT NOT NULL,
    "lien" TEXT,
    "est_lue" BOOLEAN NOT NULL DEFAULT false,
    "canal" "canal_notification" NOT NULL DEFAULT 'IN_APP',
    "envoye_le" TIMESTAMP(3),
    "lu_le" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "canal_discussion" (
    "id" TEXT NOT NULL,
    "module_id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "est_actif" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "canal_discussion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "message" (
    "id" TEXT NOT NULL,
    "canal_id" TEXT NOT NULL,
    "auteur_id" TEXT NOT NULL,
    "contenu" TEXT NOT NULL,
    "est_signale" BOOLEAN NOT NULL DEFAULT false,
    "signale_par_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "message_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fiche_revision" (
    "id" TEXT NOT NULL,
    "etudiant_id" TEXT NOT NULL,
    "matiere_id" TEXT,
    "module_id" TEXT,
    "cours_document_id" TEXT,
    "type" "type_fiche_ia" NOT NULL,
    "contenu_genere" TEXT,
    "pdf_cloudinary_url" TEXT,
    "statut" "statut_fiche" NOT NULL DEFAULT 'EN_COURS',
    "genere_le" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fiche_revision_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "interaction_ia" (
    "id" TEXT NOT NULL,
    "utilisateur_id" TEXT NOT NULL,
    "type" "type_interaction_ia" NOT NULL,
    "question" TEXT,
    "reponse" TEXT,
    "sources_json" JSONB,
    "score_similarite_moyen" DOUBLE PRECISION,
    "duree_ms" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "interaction_ia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_log" (
    "id" TEXT NOT NULL,
    "utilisateur_id" TEXT,
    "action" TEXT NOT NULL,
    "entite" TEXT NOT NULL,
    "entite_id" TEXT,
    "donnees_avant" JSONB,
    "donnees_apres" JSONB,
    "ip" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_log_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "utilisateur_email_key" ON "utilisateur"("email");

-- CreateIndex
CREATE INDEX "utilisateur_role_idx" ON "utilisateur"("role");

-- CreateIndex
CREATE UNIQUE INDEX "etudiant_matricule_key" ON "etudiant"("matricule");

-- CreateIndex
CREATE UNIQUE INDEX "refresh_token_token_hash_key" ON "refresh_token"("token_hash");

-- CreateIndex
CREATE INDEX "refresh_token_utilisateur_id_idx" ON "refresh_token"("utilisateur_id");

-- CreateIndex
CREATE UNIQUE INDEX "filiere_code_key" ON "filiere"("code");

-- CreateIndex
CREATE UNIQUE INDEX "module_code_key" ON "module"("code");

-- CreateIndex
CREATE INDEX "module_filiere_id_idx" ON "module"("filiere_id");

-- CreateIndex
CREATE UNIQUE INDEX "matiere_code_key" ON "matiere"("code");

-- CreateIndex
CREATE INDEX "matiere_module_id_idx" ON "matiere"("module_id");

-- CreateIndex
CREATE INDEX "matiere_enseignant_id_idx" ON "matiere"("enseignant_id");

-- CreateIndex
CREATE INDEX "inscription_filiere_id_idx" ON "inscription"("filiere_id");

-- CreateIndex
CREATE UNIQUE INDEX "inscription_etudiant_id_filiere_id_annee_scolaire_key" ON "inscription"("etudiant_id", "filiere_id", "annee_scolaire");

-- CreateIndex
CREATE UNIQUE INDEX "salle_nom_key" ON "salle"("nom");

-- CreateIndex
CREATE UNIQUE INDEX "emploi_du_temps_filiere_id_semestre_annee_scolaire_key" ON "emploi_du_temps"("filiere_id", "semestre", "annee_scolaire");

-- CreateIndex
CREATE INDEX "seance_emploi_du_temps_id_idx" ON "seance"("emploi_du_temps_id");

-- CreateIndex
CREATE INDEX "seance_salle_id_jour_semaine_idx" ON "seance"("salle_id", "jour_semaine");

-- CreateIndex
CREATE INDEX "seance_enseignant_id_jour_semaine_idx" ON "seance"("enseignant_id", "jour_semaine");

-- CreateIndex
CREATE INDEX "cours_document_matiere_id_idx" ON "cours_document"("matiere_id");

-- CreateIndex
CREATE INDEX "document_chunk_cours_document_id_idx" ON "document_chunk"("cours_document_id");

-- CreateIndex
CREATE INDEX "telechargement_log_cours_document_id_idx" ON "telechargement_log"("cours_document_id");

-- CreateIndex
CREATE INDEX "telechargement_log_etudiant_id_idx" ON "telechargement_log"("etudiant_id");

-- CreateIndex
CREATE INDEX "note_matiere_id_est_valide_idx" ON "note"("matiere_id", "est_valide");

-- CreateIndex
CREATE INDEX "note_etudiant_id_semestre_annee_scolaire_idx" ON "note"("etudiant_id", "semestre", "annee_scolaire");

-- CreateIndex
CREATE UNIQUE INDEX "note_etudiant_id_matiere_id_type_evaluation_semestre_annee__key" ON "note"("etudiant_id", "matiere_id", "type_evaluation", "semestre", "annee_scolaire");

-- CreateIndex
CREATE UNIQUE INDEX "bulletin_semestre_etudiant_id_semestre_annee_scolaire_key" ON "bulletin_semestre"("etudiant_id", "semestre", "annee_scolaire");

-- CreateIndex
CREATE UNIQUE INDEX "pv_deliberation_filiere_id_niveau_semestre_annee_scolaire_key" ON "pv_deliberation"("filiere_id", "niveau", "semestre", "annee_scolaire");

-- CreateIndex
CREATE INDEX "annonce_cible_filiere_id_idx" ON "annonce"("cible", "filiere_id");

-- CreateIndex
CREATE INDEX "annonce_date_publication_idx" ON "annonce"("date_publication");

-- CreateIndex
CREATE INDEX "notification_destinataire_id_est_lue_idx" ON "notification"("destinataire_id", "est_lue");

-- CreateIndex
CREATE UNIQUE INDEX "canal_discussion_module_id_key" ON "canal_discussion"("module_id");

-- CreateIndex
CREATE INDEX "message_canal_id_created_at_idx" ON "message"("canal_id", "created_at");

-- CreateIndex
CREATE INDEX "fiche_revision_etudiant_id_idx" ON "fiche_revision"("etudiant_id");

-- CreateIndex
CREATE INDEX "interaction_ia_utilisateur_id_type_idx" ON "interaction_ia"("utilisateur_id", "type");

-- CreateIndex
CREATE INDEX "audit_log_entite_entite_id_idx" ON "audit_log"("entite", "entite_id");

-- CreateIndex
CREATE INDEX "audit_log_utilisateur_id_idx" ON "audit_log"("utilisateur_id");

-- CreateIndex
CREATE INDEX "audit_log_created_at_idx" ON "audit_log"("created_at");

-- AddForeignKey
ALTER TABLE "etudiant" ADD CONSTRAINT "etudiant_utilisateur_id_fkey" FOREIGN KEY ("utilisateur_id") REFERENCES "utilisateur"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enseignant" ADD CONSTRAINT "enseignant_utilisateur_id_fkey" FOREIGN KEY ("utilisateur_id") REFERENCES "utilisateur"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admin_scolaire" ADD CONSTRAINT "admin_scolaire_utilisateur_id_fkey" FOREIGN KEY ("utilisateur_id") REFERENCES "utilisateur"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refresh_token" ADD CONSTRAINT "refresh_token_utilisateur_id_fkey" FOREIGN KEY ("utilisateur_id") REFERENCES "utilisateur"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "module" ADD CONSTRAINT "module_filiere_id_fkey" FOREIGN KEY ("filiere_id") REFERENCES "filiere"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "matiere" ADD CONSTRAINT "matiere_module_id_fkey" FOREIGN KEY ("module_id") REFERENCES "module"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "matiere" ADD CONSTRAINT "matiere_enseignant_id_fkey" FOREIGN KEY ("enseignant_id") REFERENCES "enseignant"("utilisateur_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inscription" ADD CONSTRAINT "inscription_etudiant_id_fkey" FOREIGN KEY ("etudiant_id") REFERENCES "etudiant"("utilisateur_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inscription" ADD CONSTRAINT "inscription_filiere_id_fkey" FOREIGN KEY ("filiere_id") REFERENCES "filiere"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "emploi_du_temps" ADD CONSTRAINT "emploi_du_temps_filiere_id_fkey" FOREIGN KEY ("filiere_id") REFERENCES "filiere"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "emploi_du_temps" ADD CONSTRAINT "emploi_du_temps_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "admin_scolaire"("utilisateur_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "seance" ADD CONSTRAINT "seance_emploi_du_temps_id_fkey" FOREIGN KEY ("emploi_du_temps_id") REFERENCES "emploi_du_temps"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "seance" ADD CONSTRAINT "seance_matiere_id_fkey" FOREIGN KEY ("matiere_id") REFERENCES "matiere"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "seance" ADD CONSTRAINT "seance_salle_id_fkey" FOREIGN KEY ("salle_id") REFERENCES "salle"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "seance" ADD CONSTRAINT "seance_enseignant_id_fkey" FOREIGN KEY ("enseignant_id") REFERENCES "enseignant"("utilisateur_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cours_document" ADD CONSTRAINT "cours_document_matiere_id_fkey" FOREIGN KEY ("matiere_id") REFERENCES "matiere"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cours_document" ADD CONSTRAINT "cours_document_enseignant_id_fkey" FOREIGN KEY ("enseignant_id") REFERENCES "enseignant"("utilisateur_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_chunk" ADD CONSTRAINT "document_chunk_cours_document_id_fkey" FOREIGN KEY ("cours_document_id") REFERENCES "cours_document"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "telechargement_log" ADD CONSTRAINT "telechargement_log_cours_document_id_fkey" FOREIGN KEY ("cours_document_id") REFERENCES "cours_document"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "telechargement_log" ADD CONSTRAINT "telechargement_log_etudiant_id_fkey" FOREIGN KEY ("etudiant_id") REFERENCES "etudiant"("utilisateur_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "note" ADD CONSTRAINT "note_etudiant_id_fkey" FOREIGN KEY ("etudiant_id") REFERENCES "etudiant"("utilisateur_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "note" ADD CONSTRAINT "note_matiere_id_fkey" FOREIGN KEY ("matiere_id") REFERENCES "matiere"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "note" ADD CONSTRAINT "note_saisie_par_id_fkey" FOREIGN KEY ("saisie_par_id") REFERENCES "enseignant"("utilisateur_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "note" ADD CONSTRAINT "note_valide_par_id_fkey" FOREIGN KEY ("valide_par_id") REFERENCES "admin_scolaire"("utilisateur_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bulletin_semestre" ADD CONSTRAINT "bulletin_semestre_etudiant_id_fkey" FOREIGN KEY ("etudiant_id") REFERENCES "etudiant"("utilisateur_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bulletin_semestre" ADD CONSTRAINT "bulletin_semestre_genere_par_id_fkey" FOREIGN KEY ("genere_par_id") REFERENCES "admin_scolaire"("utilisateur_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pv_deliberation" ADD CONSTRAINT "pv_deliberation_filiere_id_fkey" FOREIGN KEY ("filiere_id") REFERENCES "filiere"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pv_deliberation" ADD CONSTRAINT "pv_deliberation_genere_par_id_fkey" FOREIGN KEY ("genere_par_id") REFERENCES "admin_scolaire"("utilisateur_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "annonce" ADD CONSTRAINT "annonce_auteur_id_fkey" FOREIGN KEY ("auteur_id") REFERENCES "utilisateur"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "annonce" ADD CONSTRAINT "annonce_filiere_id_fkey" FOREIGN KEY ("filiere_id") REFERENCES "filiere"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "annonce" ADD CONSTRAINT "annonce_module_id_fkey" FOREIGN KEY ("module_id") REFERENCES "module"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification" ADD CONSTRAINT "notification_destinataire_id_fkey" FOREIGN KEY ("destinataire_id") REFERENCES "utilisateur"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "canal_discussion" ADD CONSTRAINT "canal_discussion_module_id_fkey" FOREIGN KEY ("module_id") REFERENCES "module"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "message" ADD CONSTRAINT "message_canal_id_fkey" FOREIGN KEY ("canal_id") REFERENCES "canal_discussion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "message" ADD CONSTRAINT "message_auteur_id_fkey" FOREIGN KEY ("auteur_id") REFERENCES "utilisateur"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "message" ADD CONSTRAINT "message_signale_par_id_fkey" FOREIGN KEY ("signale_par_id") REFERENCES "utilisateur"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fiche_revision" ADD CONSTRAINT "fiche_revision_etudiant_id_fkey" FOREIGN KEY ("etudiant_id") REFERENCES "etudiant"("utilisateur_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fiche_revision" ADD CONSTRAINT "fiche_revision_matiere_id_fkey" FOREIGN KEY ("matiere_id") REFERENCES "matiere"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fiche_revision" ADD CONSTRAINT "fiche_revision_module_id_fkey" FOREIGN KEY ("module_id") REFERENCES "module"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fiche_revision" ADD CONSTRAINT "fiche_revision_cours_document_id_fkey" FOREIGN KEY ("cours_document_id") REFERENCES "cours_document"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interaction_ia" ADD CONSTRAINT "interaction_ia_utilisateur_id_fkey" FOREIGN KEY ("utilisateur_id") REFERENCES "utilisateur"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_utilisateur_id_fkey" FOREIGN KEY ("utilisateur_id") REFERENCES "utilisateur"("id") ON DELETE SET NULL ON UPDATE CASCADE;
