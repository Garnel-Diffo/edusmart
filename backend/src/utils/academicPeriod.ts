/** Année scolaire courante au format "AAAA-AAAA" (rentrée en septembre). */
export function currentAnneeScolaire(): string {
  const now = new Date();
  const year = now.getFullYear();
  return now.getMonth() >= 8 ? `${year}-${year + 1}` : `${year - 1}-${year}`;
}
