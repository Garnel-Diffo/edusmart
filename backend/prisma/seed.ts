import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

/**
 * Jeu de données minimal pour démarrer en local : un super administrateur,
 * une filière avec un module/une matière, un enseignant et un étudiant déjà
 * inscrit. Permet de tester l'authentification et la navigation immédiatement
 * après `npm run db:seed`, sans dépendre de l'interface d'administration.
 */
async function main() {
  const motDePasseHash = await bcrypt.hash('EduSmart#2026', 12);

  const admin = await prisma.utilisateur.upsert({
    where: { email: 'admin@edusmart.test' },
    update: {},
    create: {
      email: 'admin@edusmart.test',
      motDePasseHash,
      nom: 'Kungne',
      prenom: 'Willy',
      role: 'SUPER_ADMIN',
      emailVerifie: true,
      adminScolaire: { create: { fonction: 'Direction des études', superAdmin: true } },
    },
  });

  const enseignantUser = await prisma.utilisateur.upsert({
    where: { email: 'enseignant@edusmart.test' },
    update: {},
    create: {
      email: 'enseignant@edusmart.test',
      motDePasseHash,
      nom: 'Mballa',
      prenom: 'Eric',
      role: 'ENSEIGNANT',
      emailVerifie: true,
      enseignant: { create: { specialite: 'Génie Logiciel', grade: 'Maître de conférences' } },
    },
  });

  const filiere = await prisma.filiere.upsert({
    where: { code: 'GI' },
    update: {},
    create: { nom: 'Génie Informatique', code: 'GI', niveau: '3', cycle: 'Ingénieur', description: 'Filière Génie Informatique' },
  });

  const filiereAIA = await prisma.filiere.upsert({
    where: { code: 'AIA-4' },
    update: {},
    create: {
      nom: 'Art et Intélligence Artificielle',
      code: 'AIA-4',
      niveau: '4',
      cycle: 'Ingénieur',
      description: 'Filière Art Numérique - Art et Intélligence Artificielle',
    },
  });

  const module1 = await prisma.module.upsert({
    where: { code: 'GI-S8-M1' },
    update: {},
    create: { filiereId: filiere.id, nom: 'Génie Logiciel Avancé', code: 'GI-S8-M1', semestre: 8, creditsEcts: 6 },
  });

  const matiere = await prisma.matiere.upsert({
    where: { code: 'AIA-4-S8-GL01' },
    update: {},
    create: {
      moduleId: module1.id,
      enseignantId: enseignantUser.id,
      nom: 'Genie Logiciel',
      code: 'AIA-4-S8-GL01',
      coefficient: 3,
      creditsEcts: 6,
    },
  });

  await prisma.canalDiscussion.upsert({
    where: { moduleId: module1.id },
    update: {},
    create: { moduleId: module1.id, nom: `Canal - ${module1.nom}` },
  });

  // Recherche par matricule (clé stable) plutôt que par email : permet de
  // corriger l'email d'un étudiant déjà semé (ex. remplacement de l'email
  // placeholder par une adresse réelle) sans violer l'unicité du matricule.
  const etudiantExistant = await prisma.etudiant.findUnique({ where: { matricule: '24P816' } });

  if (etudiantExistant && !etudiantExistant.estDelegue) {
    await prisma.etudiant.update({ where: { matricule: '24P816' }, data: { estDelegue: true } });
  }

  const etudiantUser = etudiantExistant
    ? await prisma.utilisateur.update({
        where: { id: etudiantExistant.utilisateurId },
        data: { email: 'diffogarnel@gmail.com', nom: 'Diffo', prenom: 'Garnel', emailVerifie: true },
      })
    : await prisma.utilisateur.create({
        data: {
          email: 'diffogarnel@gmail.com',
          motDePasseHash,
          nom: 'Diffo',
          prenom: 'Garnel',
          role: 'ETUDIANT',
          emailVerifie: true,
          // Délégué de démo : permet de tester directement la fonctionnalité d'annonces
          // de classe (UC18 étendu) avec le compte étudiant principal du seed.
          etudiant: { create: { matricule: '24P816', anneeEntree: 2021, estDelegue: true } },
        },
      });

  await prisma.inscription.upsert({
    where: { etudiantId_filiereId_anneeScolaire: { etudiantId: etudiantUser.id, filiereId: filiere.id, anneeScolaire: '2025-2026' } },
    update: {},
    create: { etudiantId: etudiantUser.id, filiereId: filiere.id, anneeScolaire: '2025-2026' },
  });

  console.log('Seed terminé :');
  console.log(`  Super Admin : ${admin.email} / EduSmart#2026`);
  console.log(`  Enseignant  : ${enseignantUser.email} / EduSmart#2026`);
  console.log(`  Étudiant    : ${etudiantUser.email} / EduSmart#2026`);
  console.log(`  Filière     : ${filiere.nom} (${filiere.code}), Matière : ${matiere.nom}`);
  console.log(`  Filière     : ${filiereAIA.nom} (${filiereAIA.code})`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
