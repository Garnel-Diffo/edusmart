import { statsRepository, type StatsFilters } from '@/modules/stats/stats.repository';

interface DashboardResult {
  parFiliere: { filiereId: string; nom: string; effectif: number; tauxReussite: number; moyenneGenerale: number }[];
  nbCoursDeposes: number;
  activiteChatbot: number;
  utilisateursActifs: number;
  repartitionRoles: { role: string; total: number }[];
  genereLe: string;
}

export const statsService = {
  /** UC22 - Consulter les statistiques (recalcul en temps réel, sans cache, par exigence d'exactitude). */
  async getDashboard(filters: StatsFilters): Promise<DashboardResult> {
    const [parFiliere, nbCoursDeposes, activiteChatbot, utilisateursActifs, repartitionRoles] = await Promise.all([
      statsRepository.tauxReussiteEtMoyenneParFiliere(filters),
      statsRepository.countCoursDeposes(filters),
      statsRepository.countActiviteChatbot(filters),
      statsRepository.countUtilisateursActifs(),
      statsRepository.countParRole(),
    ]);

    return {
      parFiliere,
      nbCoursDeposes,
      activiteChatbot,
      utilisateursActifs,
      repartitionRoles: repartitionRoles.map((r) => ({ role: r.role, total: r._count.role })),
      genereLe: new Date().toISOString(),
    };
  },

  toCsv(dashboard: DashboardResult): string {
    const header = 'Filiere,Effectif,TauxReussite(%),MoyenneGenerale\n';
    const rows = dashboard.parFiliere
      .map((f) => `${f.nom},${f.effectif},${f.tauxReussite},${f.moyenneGenerale}`)
      .join('\n');
    return header + rows;
  },
};
