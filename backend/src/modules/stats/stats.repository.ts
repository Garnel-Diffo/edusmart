import { prisma } from '@/config/prisma';

export interface StatsFilters {
  filiereId?: string;
  semestre?: number;
  anneeScolaire?: string;
}

export const statsRepository = {
  async tauxReussiteEtMoyenneParFiliere(filters: StatsFilters) {
    const bulletins = await prisma.bulletinSemestre.findMany({
      where: {
        semestre: filters.semestre,
        anneeScolaire: filters.anneeScolaire,
        etudiant: filters.filiereId ? { inscriptions: { some: { filiereId: filters.filiereId, statut: 'ACTIVE' } } } : undefined,
      },
      include: { etudiant: { include: { inscriptions: { include: { filiere: true } } } } },
    });

    const parFiliere: Record<string, { nom: string; total: number; admis: number; sommeMoyennes: number }> = {};
    for (const b of bulletins) {
      const filiere = b.etudiant.inscriptions[0]?.filiere;
      if (!filiere) continue;
      parFiliere[filiere.id] ??= { nom: filiere.nom, total: 0, admis: 0, sommeMoyennes: 0 };
      parFiliere[filiere.id].total += 1;
      parFiliere[filiere.id].sommeMoyennes += Number(b.moyenneGenerale);
      if (b.mention !== 'AJOURNE') parFiliere[filiere.id].admis += 1;
    }

    return Object.entries(parFiliere).map(([filiereId, v]) => ({
      filiereId,
      nom: v.nom,
      effectif: v.total,
      tauxReussite: v.total > 0 ? Math.round((v.admis / v.total) * 1000) / 10 : 0,
      moyenneGenerale: v.total > 0 ? Math.round((v.sommeMoyennes / v.total) * 100) / 100 : 0,
    }));
  },

  countCoursDeposes(filters: StatsFilters) {
    return prisma.coursDocument.count({
      where: { matiere: filters.filiereId ? { module: { filiereId: filters.filiereId } } : undefined },
    });
  },

  countActiviteChatbot(filters: StatsFilters) {
    return prisma.interactionIA.count({
      where: { type: 'CHAT', utilisateur: filters.filiereId ? { etudiant: { inscriptions: { some: { filiereId: filters.filiereId } } } } : undefined },
    });
  },

  countUtilisateursActifs() {
    return prisma.utilisateur.count({ where: { statutCompte: 'ACTIF' } });
  },

  countParRole() {
    return prisma.utilisateur.groupBy({ by: ['role'], _count: { role: true } });
  },
};
