import { z } from 'zod';

export const genererBulletinsSchema = z.object({
  filiereId: z.string().min(1),
  niveau: z.string().min(1),
  semestre: z.coerce.number().int().min(1).max(12),
  anneeScolaire: z.string().regex(/^\d{4}-\d{4}$/),
});
