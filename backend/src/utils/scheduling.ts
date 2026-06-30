export function toMinutes(heure: string): number {
  const [h, m] = heure.split(':').map(Number);
  return h * 60 + m;
}

/** Deux créneaux [debutA,finA) et [debutB,finB) se chevauchent-ils ? */
export function intervallesSeChevauchent(debutA: string, finA: string, debutB: string, finB: string): boolean {
  return toMinutes(debutA) < toMinutes(finB) && toMinutes(debutB) < toMinutes(finA);
}

/** Propose 3 créneaux successifs d'une heure à partir de la fin d'un créneau conflictuel. */
export function suggererCreneaux(apresHeure: string): string[] {
  const baseMinutes = toMinutes(apresHeure);
  return [baseMinutes, baseMinutes + 60, baseMinutes + 120].map((m) => {
    const h = Math.floor(m / 60) % 24;
    const min = m % 60;
    return `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
  });
}
