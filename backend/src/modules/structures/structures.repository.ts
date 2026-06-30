import { prisma } from '@/config/prisma';
import type { Prisma, TypeSalle } from '@prisma/client';

export const structuresRepository = {
  // ----- Filière -----
  filiere: {
    findAll: () => prisma.filiere.findMany({ orderBy: { nom: 'asc' } }),
    findById: (id: string) => prisma.filiere.findUnique({ where: { id }, include: { modules: true } }),
    create: (data: Prisma.FiliereCreateInput) => prisma.filiere.create({ data }),
    update: (id: string, data: Prisma.FiliereUpdateInput) => prisma.filiere.update({ where: { id }, data }),
    remove: (id: string) => prisma.filiere.delete({ where: { id } }),
  },

  // ----- Module -----
  module: {
    findAll: (filiereId?: string) =>
      prisma.module.findMany({ where: filiereId ? { filiereId } : undefined, orderBy: { semestre: 'asc' }, include: { filiere: true } }),
    findById: (id: string) => prisma.module.findUnique({ where: { id }, include: { matieres: true, filiere: true } }),
    create: (data: Prisma.ModuleCreateInput) => prisma.module.create({ data }),
    update: (id: string, data: Prisma.ModuleUpdateInput) => prisma.module.update({ where: { id }, data }),
    remove: (id: string) => prisma.module.delete({ where: { id } }),
  },

  // ----- Matière -----
  matiere: {
    findAll: (moduleId?: string) =>
      prisma.matiere.findMany({
        where: moduleId ? { moduleId } : undefined,
        orderBy: { nom: 'asc' },
        include: { module: true, enseignant: { include: { utilisateur: true } } },
      }),
    findById: (id: string) =>
      prisma.matiere.findUnique({
        where: { id },
        include: { module: { include: { filiere: true } }, enseignant: { include: { utilisateur: true } } },
      }),
    create: (data: Prisma.MatiereCreateInput) => prisma.matiere.create({ data }),
    update: (id: string, data: Prisma.MatiereUpdateInput) => prisma.matiere.update({ where: { id }, data }),
    remove: (id: string) => prisma.matiere.delete({ where: { id } }),
  },

  // ----- Salle -----
  salle: {
    findAll: (type?: TypeSalle) => prisma.salle.findMany({ where: type ? { type } : undefined, orderBy: { nom: 'asc' } }),
    findById: (id: string) => prisma.salle.findUnique({ where: { id } }),
    create: (data: Prisma.SalleCreateInput) => prisma.salle.create({ data }),
    update: (id: string, data: Prisma.SalleUpdateInput) => prisma.salle.update({ where: { id }, data }),
    remove: (id: string) => prisma.salle.delete({ where: { id } }),
  },
};
