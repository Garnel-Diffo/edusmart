import { z } from 'zod';

export const createAnnonceSchema = z
  .object({
    titre: z.string().min(3, 'Le titre est requis').max(150),
    contenu: z.string().min(5, 'Le contenu est requis').max(5000),
    cible: z.enum(['TOUS', 'FILIERE', 'MODULE', 'ETUDIANT']),
    filiereId: z.string().optional(),
    moduleId: z.string().optional(),
    etudiantCibleId: z.string().optional(),
  })
  .refine((data) => data.cible !== 'FILIERE' || Boolean(data.filiereId), { message: 'filiereId requis pour une cible FILIERE', path: ['filiereId'] })
  .refine((data) => data.cible !== 'MODULE' || Boolean(data.moduleId), { message: 'moduleId requis pour une cible MODULE', path: ['moduleId'] })
  .refine((data) => data.cible !== 'ETUDIANT' || Boolean(data.etudiantCibleId), {
    message: 'etudiantCibleId requis pour une cible ETUDIANT',
    path: ['etudiantCibleId'],
  });

export const listAnnoncesQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  pageSize: z.coerce.number().int().min(1).max(100).optional(),
});
