/** Année scolaire courante au format "AAAA-AAAA" (rentrée en septembre). */
export function currentAnneeScolaire(): string {
  const now = new Date();
  const year = now.getFullYear();
  return now.getMonth() >= 8 ? `${year}-${year + 1}` : `${year - 1}-${year}`;
}

export function anneeScolaireOptions(count = 4): string[] {
  const current = currentAnneeScolaire();
  const startYear = Number(current.split('-')[0]);
  return Array.from({ length: count }, (_, i) => {
    const y = startYear - i;
    return `${y}-${y + 1}`;
  });
}

export const SEMESTRE_OPTIONS = Array.from({ length: 10 }, (_, i) => i + 1);

/** L'emploi du temps est déposé par fichier, à raison de 2 semestres par année scolaire. */
export const SEMESTRE_EDT_OPTIONS = [1, 2];
