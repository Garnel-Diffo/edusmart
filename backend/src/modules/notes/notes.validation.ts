import { z } from 'zod';

export const saisirNotesSchema = z.object({
  matiereId: z.string().min(1),
  typeEvaluation: z.enum(['CONTROLE', 'EXAMEN', 'TP', 'PROJET']),
  semestre: z.coerce.number().int().min(1).max(12),
  anneeScolaire: z.string().regex(/^\d{4}-\d{4}$/),
  coefficientEvaluation: z.coerce.number().min(0.1).max(10).default(1),
  notes: z
    .array(
      z.object({
        etudiantId: z.string().min(1),
        valeur: z.coerce.number().min(0, 'La note doit être comprise entre 0 et 20').max(20, 'La note doit être comprise entre 0 et 20'),
      }),
    )
    .min(1),
});

export const validerNotesSchema = z.object({
  matiereId: z.string().min(1),
  semestre: z.coerce.number().int().min(1).max(12),
  anneeScolaire: z.string().regex(/^\d{4}-\d{4}$/),
});

export const refuserValidationSchema = validerNotesSchema.extend({
  commentaire: z.string().min(5, 'Un commentaire explicatif est requis pour justifier le refus'),
});

export const consulterNotesQuerySchema = z.object({
  semestre: z.coerce.number().int().min(1).max(12),
  anneeScolaire: z.string().regex(/^\d{4}-\d{4}$/),
});
