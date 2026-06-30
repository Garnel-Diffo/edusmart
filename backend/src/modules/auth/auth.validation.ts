import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email("Adresse email institutionnelle invalide"),
  motDePasse: z.string().min(1, 'Le mot de passe est requis'),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1),
  nouveauMotDePasse: z
    .string()
    .min(8, 'Le mot de passe doit contenir au moins 8 caractères')
    .regex(/[A-Z]/, 'Le mot de passe doit contenir au moins une majuscule')
    .regex(/[0-9]/, 'Le mot de passe doit contenir au moins un chiffre'),
});

export const changePasswordSchema = z.object({
  ancienMotDePasse: z.string().min(1),
  nouveauMotDePasse: resetPasswordSchema.shape.nouveauMotDePasse,
});

export const updateProfileSchema = z.object({
  nom: z.string().min(2).optional(),
  prenom: z.string().min(2).optional(),
  telephone: z.string().optional(),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
