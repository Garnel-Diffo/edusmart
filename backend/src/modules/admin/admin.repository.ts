import { prisma } from '@/config/prisma';
import type { Prisma, RoleUtilisateur } from '@prisma/client';
import type { CreateUtilisateurInput } from '@/modules/admin/admin.validation';
import { currentAnneeScolaire } from '@/utils/academicPeriod';

export const adminRepository = {
  findByEmail(email: string) {
    return prisma.utilisateur.findUnique({ where: { email } });
  },

  findById(id: string) {
    return prisma.utilisateur.findUnique({
      where: { id },
      include: { etudiant: true, enseignant: true, adminScolaire: true },
    });
  },

  list(filters: { role?: RoleUtilisateur; recherche?: string }, skip: number, take: number) {
    const where: Prisma.UtilisateurWhereInput = {
      role: filters.role,
      ...(filters.recherche
        ? {
            OR: [
              { nom: { contains: filters.recherche, mode: 'insensitive' } },
              { prenom: { contains: filters.recherche, mode: 'insensitive' } },
              { email: { contains: filters.recherche, mode: 'insensitive' } },
            ],
          }
        : {}),
    };
    return Promise.all([
      prisma.utilisateur.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: { etudiant: true, enseignant: true, adminScolaire: true },
      }),
      prisma.utilisateur.count({ where }),
    ]);
  },

  /** Crée l'utilisateur de base + son profil spécialisé (Étudiant/Enseignant/AdminScolaire) en une transaction. */
  createWithProfile(data: CreateUtilisateurInput & { motDePasseHash: string }) {
    return prisma.$transaction(async (tx) => {
      const utilisateur = await tx.utilisateur.create({
        data: {
          nom: data.nom,
          prenom: data.prenom,
          email: data.email,
          telephone: data.telephone,
          role: data.role,
          motDePasseHash: data.motDePasseHash,
        },
      });

      if (data.role === 'ETUDIANT') {
        await tx.etudiant.create({
          data: {
            utilisateurId: utilisateur.id,
            matricule: data.matricule!,
            anneeEntree: data.anneeEntree!,
          },
        });
        if (data.filiereId) {
          await tx.inscription.create({
            data: {
              etudiantId: utilisateur.id,
              filiereId: data.filiereId,
              anneeScolaire: currentAnneeScolaire(),
              statut: 'ACTIVE',
            },
          });
        }
      } else if (data.role === 'ENSEIGNANT') {
        await tx.enseignant.create({
          data: { utilisateurId: utilisateur.id, specialite: data.specialite, grade: data.grade },
        });
      } else if (data.role === 'ADMIN_SCOLAIRE' || data.role === 'SUPER_ADMIN') {
        await tx.adminScolaire.create({
          data: { utilisateurId: utilisateur.id, fonction: data.fonction, superAdmin: data.role === 'SUPER_ADMIN' },
        });
      }

      return utilisateur;
    });
  },

  update(id: string, data: Prisma.UtilisateurUpdateInput) {
    return prisma.utilisateur.update({ where: { id }, data });
  },

  countAdminsActifs(excludeId?: string) {
    return prisma.utilisateur.count({
      where: {
        role: { in: ['ADMIN_SCOLAIRE', 'SUPER_ADMIN'] },
        statutCompte: 'ACTIF',
        id: excludeId ? { not: excludeId } : undefined,
      },
    });
  },

  createInscription(data: { etudiantId: string; filiereId: string; anneeScolaire: string }) {
    return prisma.inscription.create({ data });
  },

  setDelegue(etudiantId: string, estDelegue: boolean) {
    return prisma.etudiant.update({ where: { utilisateurId: etudiantId }, data: { estDelegue } });
  },
};
