import { z } from 'zod';

const heureRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;

export const getEmploiDuTempsQuerySchema = z.object({
  filiereId: z.string().min(1).optional(), // optionnel pour un étudiant : déduit de son inscription
  semestre: z.coerce.number().int().min(1).max(12),
  anneeScolaire: z.string().regex(/^\d{4}-\d{4}$/),
});

export const createSeanceSchema = z
  .object({
    matiereId: z.string().min(1),
    salleId: z.string().min(1),
    enseignantId: z.string().min(1),
    jourSemaine: z.enum(['LUNDI', 'MARDI', 'MERCREDI', 'JEUDI', 'VENDREDI', 'SAMEDI', 'DIMANCHE']),
    heureDebut: z.string().regex(heureRegex, 'Format attendu HH:MM'),
    heureFin: z.string().regex(heureRegex, 'Format attendu HH:MM'),
    typeSeance: z.enum(['COURS', 'TD', 'TP']).default('COURS'),
  })
  .refine((data) => data.heureDebut < data.heureFin, {
    message: "L'heure de fin doit être après l'heure de début",
    path: ['heureFin'],
  });

export const updateSeanceSchema = createSeanceSchema.innerType().partial();
