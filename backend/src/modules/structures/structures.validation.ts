import { z } from 'zod';

export const filiereSchema = z.object({
  nom: z.string().min(2),
  code: z.string().min(2).max(20),
  niveau: z.string().min(1),
  cycle: z.string().min(2),
  description: z.string().optional(),
  salleAttitreeId: z.string().optional(),
});

export const moduleSchema = z.object({
  filiereId: z.string().min(1),
  nom: z.string().min(2),
  code: z.string().min(2).max(20),
  semestre: z.coerce.number().int().min(1).max(12),
  creditsEcts: z.coerce.number().int().min(1).max(60),
});

export const matiereSchema = z.object({
  moduleId: z.string().min(1),
  enseignantId: z.string().min(1).optional(),
  nom: z.string().min(2),
  code: z.string().min(2).max(20),
  coefficient: z.coerce.number().min(0.1).max(10),
  creditsEcts: z.coerce.number().int().min(1).max(30),
});

export const salleSchema = z.object({
  nom: z.string().min(1),
  capacite: z.coerce.number().int().min(1),
  type: z.enum(['AMPHITHEATRE', 'LABO', 'SALLE_COURS']),
  batiment: z.string().optional(),
});

export const idParamSchema = z.object({ id: z.string().min(1) });
