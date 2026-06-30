import { z } from 'zod';

export const chatSchema = z.object({
  question: z.string().min(3, 'Veuillez préciser votre question').max(2000),
});

export const searchSchema = z.object({
  requete: z.string().min(3, 'Veuillez préciser votre recherche (3 caractères minimum)').max(500), // UC15 - E2
});

export const ficheSchema = z
  .object({
    type: z.enum(['FICHE_RESUME', 'RESUME_DETAILLE', 'QUIZ_QCM']),
    matiereId: z.string().optional(),
    moduleId: z.string().optional(),
    coursDocumentId: z.string().optional(),
  })
  .refine((d) => d.matiereId || d.moduleId || d.coursDocumentId, {
    message: 'Veuillez sélectionner un module, une matière ou un document',
  });

export const ficheCallbackSchema = z.object({
  ficheRevisionId: z.string().min(1),
  statut: z.enum(['PRET', 'ECHEC']),
  contenuGenere: z.string().optional(),
  pdfCloudinaryUrl: z.string().optional(),
});
