import { z } from 'zod';

const baseUtilisateurSchema = z.object({
  nom: z.string().min(2),
  prenom: z.string().min(2),
  email: z.string().email(),
  telephone: z.string().optional(),
  role: z.enum(['ETUDIANT', 'ENSEIGNANT', 'ADMIN_SCOLAIRE', 'DIRECTION', 'SUPER_ADMIN']),
});

export const createUtilisateurSchema = baseUtilisateurSchema.extend({
  // Champs spécifiques Étudiant
  matricule: z.string().optional(),
  niveau: z.string().optional(),
  anneeEntree: z.coerce.number().int().optional(),
  // Champs spécifiques Enseignant
  specialite: z.string().optional(),
  grade: z.string().optional(),
  // Champs spécifiques Admin
  fonction: z.string().optional(),
  superAdmin: z.coerce.boolean().optional(),
});

export const updateUtilisateurSchema = baseUtilisateurSchema.partial().extend({
  statutCompte: z.enum(['ACTIF', 'DESACTIVE', 'VERROUILLE']).optional(),
});

export const createInscriptionSchema = z.object({
  etudiantId: z.string().min(1),
  filiereId: z.string().min(1),
  anneeScolaire: z.string().regex(/^\d{4}-\d{4}$/, 'Format attendu : AAAA-AAAA'),
  niveau: z.string().min(1),
});

export type CreateUtilisateurInput = z.infer<typeof createUtilisateurSchema>;
export type UpdateUtilisateurInput = z.infer<typeof updateUtilisateurSchema>;
