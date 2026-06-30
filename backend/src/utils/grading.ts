import type { Mention } from '@prisma/client';

export interface NoteCoefficiee {
  valeur: number;
  coefficient: number;
}

/** Moyenne pondérée conforme aux coefficients du référentiel pédagogique (UC8 NFR "exactitude"). */
export function calculerMoyennePonderee(notes: NoteCoefficiee[]): number {
  if (notes.length === 0) return 0;
  const sommePonderee = notes.reduce((acc, n) => acc + n.valeur * n.coefficient, 0);
  const sommeCoefficients = notes.reduce((acc, n) => acc + n.coefficient, 0);
  if (sommeCoefficients === 0) return 0;
  return Math.round((sommePonderee / sommeCoefficients) * 100) / 100;
}

/** Barème de mention standard (échelle 0-20). */
export function calculerMention(moyenne: number): Mention {
  if (moyenne >= 18) return 'EXCELLENT';
  if (moyenne >= 16) return 'TRES_BIEN';
  if (moyenne >= 14) return 'BIEN';
  if (moyenne >= 12) return 'ASSEZ_BIEN';
  if (moyenne >= 10) return 'PASSABLE';
  return 'AJOURNE';
}

/**
 * Classement par "rang de compétition" : deux moyennes identiques partagent le
 * même rang, le rang suivant tient compte du nombre d'ex-aequo (1, 2, 2, 4...).
 */
export function calculerClassement<T extends { id: string; moyenne: number }>(etudiants: T[]): Map<string, number> {
  const tries = [...etudiants].sort((a, b) => b.moyenne - a.moyenne);
  const classement = new Map<string, number>();
  let rang = 0;
  let dernierMoyenne: number | null = null;

  tries.forEach((etudiant, index) => {
    if (dernierMoyenne === null || etudiant.moyenne !== dernierMoyenne) {
      rang = index + 1;
      dernierMoyenne = etudiant.moyenne;
    }
    classement.set(etudiant.id, rang);
  });

  return classement;
}
