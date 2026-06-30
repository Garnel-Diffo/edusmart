import { z } from 'zod';

export const uploadDocumentPersonnelSchema = z.object({
  titre: z.string().min(2).max(200),
});
