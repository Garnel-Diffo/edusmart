import { authRepository } from '@/modules/auth/auth.repository';
import { comparePassword } from '@/utils/password';
import { authService } from '@/modules/auth/auth.service';

jest.mock('@/modules/auth/auth.repository');
jest.mock('@/utils/password');
jest.mock('@/utils/audit', () => ({ recordAudit: jest.fn() }));
jest.mock('@/config/brevo', () => ({ sendEmail: jest.fn().mockResolvedValue(true) }));

const mockedRepo = authRepository as jest.Mocked<typeof authRepository>;
const mockedComparePassword = comparePassword as jest.MockedFunction<typeof comparePassword>;

function buildUser(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: 'user-1',
    email: 'etudiant@edusmart.test',
    motDePasseHash: 'hash',
    nom: 'Dupont',
    prenom: 'Jean',
    role: 'ETUDIANT',
    statutCompte: 'ACTIF',
    tentativesEchouees: 0,
    verrouilleJusquA: null,
    ...overrides,
  } as never;
}

describe('authService.login — verrouillage de compte (UC0)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('refuse un mot de passe invalide avec un message générique et incrémente le compteur', async () => {
    mockedRepo.findByEmail.mockResolvedValue(buildUser({ tentativesEchouees: 1 }));
    mockedComparePassword.mockResolvedValue(false);
    mockedRepo.incrementFailedAttempts.mockResolvedValue(buildUser({ tentativesEchouees: 2 }));

    await expect(authService.login('etudiant@edusmart.test', 'mauvais-mdp', {})).rejects.toMatchObject({
      statusCode: 401,
      message: 'Email ou mot de passe incorrect',
    });

    expect(mockedRepo.incrementFailedAttempts).toHaveBeenCalledWith('user-1');
    expect(mockedRepo.lockAccount).not.toHaveBeenCalled();
  });

  it('verrouille le compte pendant 15 minutes après la 5e tentative échouée', async () => {
    mockedRepo.findByEmail.mockResolvedValue(buildUser({ tentativesEchouees: 4 }));
    mockedComparePassword.mockResolvedValue(false);
    mockedRepo.incrementFailedAttempts.mockResolvedValue(buildUser({ tentativesEchouees: 5 }));

    await expect(authService.login('etudiant@edusmart.test', 'mauvais-mdp', {})).rejects.toMatchObject({ statusCode: 401 });

    expect(mockedRepo.lockAccount).toHaveBeenCalledTimes(1);
    const [, until] = mockedRepo.lockAccount.mock.calls[0];
    expect(until.getTime()).toBeGreaterThan(Date.now() + 14 * 60_000);
    expect(until.getTime()).toBeLessThanOrEqual(Date.now() + 15 * 60_000 + 1000);
  });

  it('refuse la connexion tant que le compte est verrouillé, sans revérifier le mot de passe', async () => {
    mockedRepo.findByEmail.mockResolvedValue(buildUser({ verrouilleJusquA: new Date(Date.now() + 5 * 60_000) }));

    await expect(authService.login('etudiant@edusmart.test', 'peu-importe', {})).rejects.toMatchObject({ statusCode: 403 });

    expect(mockedComparePassword).not.toHaveBeenCalled();
  });

  it('refuse la connexion pour un compte désactivé', async () => {
    mockedRepo.findByEmail.mockResolvedValue(buildUser({ statutCompte: 'DESACTIVE' }));

    await expect(authService.login('etudiant@edusmart.test', 'peu-importe', {})).rejects.toMatchObject({ statusCode: 403 });
  });

  it('réinitialise le compteur et déverrouille après une connexion réussie', async () => {
    mockedRepo.findByEmail.mockResolvedValue(buildUser({ tentativesEchouees: 3 }));
    mockedComparePassword.mockResolvedValue(true);
    mockedRepo.resetFailedAttemptsAndUnlock.mockResolvedValue(buildUser());
    mockedRepo.createRefreshToken.mockResolvedValue({} as never);

    const result = await authService.login('etudiant@edusmart.test', 'bon-mdp', {});

    expect(mockedRepo.resetFailedAttemptsAndUnlock).toHaveBeenCalledWith('user-1');
    expect(result.accessToken).toBeDefined();
    expect(result.refreshToken).toBeDefined();
  });
});
