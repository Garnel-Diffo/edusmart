import type { RoleUtilisateur } from '@prisma/client';
import { adminRepository } from '@/modules/admin/admin.repository';
import type { CreateUtilisateurInput, UpdateUtilisateurInput } from '@/modules/admin/admin.validation';
import { ApiError } from '@/utils/ApiError';
import { generateTemporaryPassword, hashPassword } from '@/utils/password';
import { recordAudit } from '@/utils/audit';
import { sendEmail } from '@/config/brevo';
import { welcomeAccountEmail } from '@/utils/emailTemplates';
import { env } from '@/config/env';
import { logger } from '@/config/logger';
import { parsePagination, buildPaginatedResult, type PaginationQuery } from '@/utils/pagination';

const ROLE_REQUIRED_FIELDS: Record<RoleUtilisateur, (keyof CreateUtilisateurInput)[]> = {
  ETUDIANT: ['matricule', 'filiereId', 'anneeEntree'],
  ENSEIGNANT: [],
  ADMIN_SCOLAIRE: [],
  SUPER_ADMIN: [],
  DIRECTION: [],
};

function sanitize<T extends { motDePasseHash?: string }>(user: T) {
  const { motDePasseHash: _motDePasseHash, ...rest } = user;
  return rest;
}

export const adminService = {
  async list(filters: { role?: RoleUtilisateur; recherche?: string }, query: PaginationQuery) {
    const { page, pageSize, skip, take } = parsePagination(query);
    const [data, total] = await adminRepository.list(filters, skip, take);
    return buildPaginatedResult(data.map(sanitize), total, page, pageSize);
  },

  async get(id: string) {
    const user = await adminRepository.findById(id);
    if (!user) throw ApiError.notFound('Utilisateur introuvable');
    return sanitize(user);
  },

  /** UC21 - Créer un utilisateur (étudiant, enseignant ou admin). */
  async create(input: CreateUtilisateurInput, adminId: string) {
    const existant = await adminRepository.findByEmail(input.email);
    if (existant) throw ApiError.conflict('Un compte avec cet email existe déjà'); // UC21 - 4a

    const champsManquants = ROLE_REQUIRED_FIELDS[input.role].filter((champ) => input[champ] === undefined);
    if (champsManquants.length > 0) {
      throw ApiError.badRequest(`Champs requis manquants pour le rôle ${input.role}`, { champsManquants }); // UC21 - 4b
    }

    const motDePasseTemporaire = generateTemporaryPassword();
    const motDePasseHash = await hashPassword(motDePasseTemporaire);

    const utilisateur = await adminRepository.createWithProfile({ ...input, motDePasseHash });

    await recordAudit({ utilisateurId: adminId, action: 'CREATE', entite: 'Utilisateur', entiteId: utilisateur.id, donneesApres: { email: input.email, role: input.role } });

    const { subject, html } = welcomeAccountEmail({
      nom: input.nom,
      prenom: input.prenom,
      email: input.email,
      motDePasseTemporaire,
      loginUrl: `${env.FRONTEND_URL}/login`,
    });
    const envoye = await sendEmail({ to: [{ email: input.email, name: `${input.prenom} ${input.nom}` }], subject, htmlContent: html });
    if (!envoye) logger.warn({ email: input.email }, "Email de bienvenue non envoyé (échec Brevo)");

    return sanitize(utilisateur);
  },

  /** UC21 - Modifier ou désactiver un utilisateur. */
  async update(id: string, input: UpdateUtilisateurInput, adminId: string) {
    const cible = await adminRepository.findById(id);
    if (!cible) throw ApiError.notFound('Utilisateur introuvable');

    if (input.email && input.email !== cible.email) {
      const existant = await adminRepository.findByEmail(input.email);
      if (existant) throw ApiError.conflict('Un compte avec cet email existe déjà');
    }

    if (input.statutCompte === 'DESACTIVE' && cible.role !== 'ETUDIANT') {
      const isAdmin = cible.role === 'ADMIN_SCOLAIRE' || cible.role === 'SUPER_ADMIN';
      if (isAdmin) {
        const autresAdminsActifs = await adminRepository.countAdminsActifs(id);
        if (autresAdminsActifs === 0) {
          throw ApiError.forbidden('Impossible de désactiver le dernier compte administrateur actif'); // UC21 - E1
        }
      }
    }

    const avant = sanitize(cible);
    const updated = await adminRepository.update(id, input);
    await recordAudit({ utilisateurId: adminId, action: 'UPDATE', entite: 'Utilisateur', entiteId: id, donneesAvant: avant, donneesApres: sanitize(updated) });

    return sanitize(updated);
  },

  async createInscription(data: { etudiantId: string; filiereId: string; anneeScolaire: string }, adminId: string) {
    const inscription = await adminRepository.createInscription(data);
    await recordAudit({ utilisateurId: adminId, action: 'CREATE', entite: 'Inscription', entiteId: inscription.id, donneesApres: inscription });
    return inscription;
  },

  /** Désigne ou retire le statut de délégué d'un étudiant pour sa filière (UC18 étendu). */
  async setDelegue(etudiantId: string, estDelegue: boolean, adminId: string) {
    const cible = await adminRepository.findById(etudiantId);
    if (!cible || !cible.etudiant) throw ApiError.notFound('Étudiant introuvable');

    const updated = await adminRepository.setDelegue(etudiantId, estDelegue);
    await recordAudit({
      utilisateurId: adminId,
      action: estDelegue ? 'SET_DELEGUE' : 'UNSET_DELEGUE',
      entite: 'Etudiant',
      entiteId: etudiantId,
      donneesApres: { estDelegue },
    });
    return updated;
  },
};
