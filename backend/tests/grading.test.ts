import { calculerMoyennePonderee, calculerMention, calculerClassement } from '@/utils/grading';

describe('calculerMoyennePonderee', () => {
  it('calcule une moyenne pondérée simple conforme aux coefficients (UC8/UC9)', () => {
    // (14*2 + 10*1) / (2+1) = 38/3 = 12.67
    const moyenne = calculerMoyennePonderee([
      { valeur: 14, coefficient: 2 },
      { valeur: 10, coefficient: 1 },
    ]);
    expect(moyenne).toBeCloseTo(12.67, 2);
  });

  it('retourne 0 pour une liste vide (aucune note)', () => {
    expect(calculerMoyennePonderee([])).toBe(0);
  });

  it('ignore correctement un coefficient nul global sans diviser par zéro', () => {
    expect(calculerMoyennePonderee([{ valeur: 15, coefficient: 0 }])).toBe(0);
  });

  it('gère un coefficient unique (moyenne = valeur)', () => {
    expect(calculerMoyennePonderee([{ valeur: 17, coefficient: 1 }])).toBe(17);
  });
});

describe('calculerMention', () => {
  it.each([
    [19, 'EXCELLENT'],
    [18, 'EXCELLENT'],
    [17, 'TRES_BIEN'],
    [16, 'TRES_BIEN'],
    [15, 'BIEN'],
    [14, 'BIEN'],
    [13, 'ASSEZ_BIEN'],
    [12, 'ASSEZ_BIEN'],
    [11, 'PASSABLE'],
    [10, 'PASSABLE'],
    [9.99, 'AJOURNE'],
    [0, 'AJOURNE'],
  ])('attribue la mention %s -> %s selon le barème officiel', (moyenne, mentionAttendue) => {
    expect(calculerMention(moyenne)).toBe(mentionAttendue);
  });
});

describe('calculerClassement', () => {
  it('classe par moyenne décroissante avec rang de compétition (ex-aequo)', () => {
    const classement = calculerClassement([
      { id: 'a', moyenne: 15 },
      { id: 'b', moyenne: 18 },
      { id: 'c', moyenne: 15 },
      { id: 'd', moyenne: 12 },
    ]);

    expect(classement.get('b')).toBe(1); // meilleure moyenne
    expect(classement.get('a')).toBe(2); // ex-aequo avec c
    expect(classement.get('c')).toBe(2); // ex-aequo avec a
    expect(classement.get('d')).toBe(4); // tient compte des 2 ex-aequo devant
  });

  it("retourne un classement vide pour une promotion vide", () => {
    expect(calculerClassement([]).size).toBe(0);
  });
});
