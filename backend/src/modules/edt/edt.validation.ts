import { z } from 'zod';

export const getEmploiDuTempsQuerySchema = z.object({
  filiereId: z.string().min(1).optional(), // optionnel pour un étudiant : déduit de son inscription
  semestre: z.coerce.number().int().min(1).max(2),
  anneeScolaire: z.string().regex(/^\d{4}-\d{4}$/),
});

export const uploadEmploiDuTempsSchema = z.object({
  filiereId: z.string().min(1),
  semestre: z.coerce.number().int().min(1).max(2), // un établissement compte 2 semestres par année scolaire
  anneeScolaire: z.string().regex(/^\d{4}-\d{4}$/),
  titre: z.string().max(150).optional(),
});
