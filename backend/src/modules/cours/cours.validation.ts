import { z } from 'zod';

export const uploadCoursSchema = z.object({
  matiereId: z.string().min(1),
  titre: z.string().min(2).max(200),
  remplacerDoublon: z.coerce.boolean().optional().default(false), // UC3 - E3
});

export const listCoursQuerySchema = z.object({
  matiereId: z.string().optional(),
  moduleId: z.string().optional(),
  page: z.coerce.number().int().min(1).optional(),
  pageSize: z.coerce.number().int().min(1).max(100).optional(),
});
