import { intervallesSeChevauchent, suggererCreneaux, toMinutes } from '@/utils/scheduling';

describe('toMinutes', () => {
  it('convertit HH:MM en minutes depuis minuit', () => {
    expect(toMinutes('08:00')).toBe(480);
    expect(toMinutes('00:00')).toBe(0);
    expect(toMinutes('23:59')).toBe(1439);
  });
});

describe('intervallesSeChevauchent (détection de conflits EDT - UC6)', () => {
  it('détecte un chevauchement partiel', () => {
    expect(intervallesSeChevauchent('08:00', '10:00', '09:00', '11:00')).toBe(true);
  });

  it('détecte un chevauchement total (créneau englobant)', () => {
    expect(intervallesSeChevauchent('08:00', '12:00', '09:00', '10:00')).toBe(true);
  });

  it("ne détecte pas de conflit pour des créneaux contigus (l'un finit quand l'autre commence)", () => {
    expect(intervallesSeChevauchent('08:00', '10:00', '10:00', '12:00')).toBe(false);
  });

  it('ne détecte pas de conflit pour des créneaux disjoints', () => {
    expect(intervallesSeChevauchent('08:00', '09:00', '14:00', '15:00')).toBe(false);
  });

  it('détecte un conflit même avec des créneaux identiques', () => {
    expect(intervallesSeChevauchent('08:00', '10:00', '08:00', '10:00')).toBe(true);
  });
});

describe('suggererCreneaux', () => {
  it('propose 3 créneaux successifs après le créneau en conflit', () => {
    expect(suggererCreneaux('10:00')).toEqual(['10:00', '11:00', '12:00']);
  });

  it('gère le passage de minuit', () => {
    expect(suggererCreneaux('23:30')).toEqual(['23:30', '00:30', '01:30']);
  });
});
