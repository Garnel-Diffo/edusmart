import { z } from 'zod';

export const statsQuerySchema = z.object({
  filiereId: z.string().optional(),
  semestre: z.coerce.number().int().min(1).max(12).optional(),
  anneeScolaire: z.string().regex(/^\d{4}-\d{4}$/).optional(),
  format: z.enum(['json', 'csv', 'pdf']).optional().default('json'),
});
