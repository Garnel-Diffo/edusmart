import { structuresRepository } from '@/modules/structures/structures.repository';
import { recordAudit } from '@/utils/audit';
import { ApiError } from '@/utils/ApiError';
import type { TypeSalle } from '@prisma/client';

export const structuresService = {
  filiere: {
    list: () => structuresRepository.filiere.findAll(),
    get: async (id: string) => {
      const filiere = await structuresRepository.filiere.findById(id);
      if (!filiere) throw ApiError.notFound('Filière introuvable');
      return filiere;
    },
    async create(
      data: { nom: string; code: string; niveau: string; cycle: string; description?: string; salleAttitreeId?: string },
      adminId: string,
    ) {
      const { salleAttitreeId, ...rest } = data;
      const filiere = await structuresRepository.filiere.create({
        ...rest,
        ...(salleAttitreeId ? { salleAttitree: { connect: { id: salleAttitreeId } } } : {}),
      });
      await recordAudit({ utilisateurId: adminId, action: 'CREATE', entite: 'Filiere', entiteId: filiere.id, donneesApres: filiere });
      return filiere;
    },
    async update(
      id: string,
      data: Partial<{ nom: string; code: string; niveau: string; cycle: string; description: string; salleAttitreeId: string | null }>,
      adminId: string,
    ) {
      const avant = await structuresService.filiere.get(id);
      const { salleAttitreeId, ...rest } = data;
      const filiere = await structuresRepository.filiere.update(id, {
        ...rest,
        ...(salleAttitreeId !== undefined
          ? { salleAttitree: salleAttitreeId ? { connect: { id: salleAttitreeId } } : { disconnect: true } }
          : {}),
      });
      await recordAudit({ utilisateurId: adminId, action: 'UPDATE', entite: 'Filiere', entiteId: id, donneesAvant: avant, donneesApres: filiere });
      return filiere;
    },
    async remove(id: string, adminId: string) {
      await structuresService.filiere.get(id);
      await structuresRepository.filiere.remove(id);
      await recordAudit({ utilisateurId: adminId, action: 'DELETE', entite: 'Filiere', entiteId: id });
    },
  },

  module: {
    list: (filiereId?: string) => structuresRepository.module.findAll(filiereId),
    get: async (id: string) => {
      const m = await structuresRepository.module.findById(id);
      if (!m) throw ApiError.notFound('Module introuvable');
      return m;
    },
    async create(data: { filiereId: string; nom: string; code: string; semestre: number; creditsEcts: number }, adminId: string) {
      const created = await structuresRepository.module.create({
        nom: data.nom,
        code: data.code,
        semestre: data.semestre,
        creditsEcts: data.creditsEcts,
        filiere: { connect: { id: data.filiereId } },
      });
      await recordAudit({ utilisateurId: adminId, action: 'CREATE', entite: 'Module', entiteId: created.id, donneesApres: created });
      return created;
    },
    async update(id: string, data: Partial<{ nom: string; code: string; semestre: number; creditsEcts: number }>, adminId: string) {
      const avant = await structuresService.module.get(id);
      const updated = await structuresRepository.module.update(id, data);
      await recordAudit({ utilisateurId: adminId, action: 'UPDATE', entite: 'Module', entiteId: id, donneesAvant: avant, donneesApres: updated });
      return updated;
    },
    async remove(id: string, adminId: string) {
      await structuresService.module.get(id);
      await structuresRepository.module.remove(id);
      await recordAudit({ utilisateurId: adminId, action: 'DELETE', entite: 'Module', entiteId: id });
    },
  },

  matiere: {
    list: (moduleId?: string) => structuresRepository.matiere.findAll(moduleId),
    get: async (id: string) => {
      const m = await structuresRepository.matiere.findById(id);
      if (!m) throw ApiError.notFound('Matière introuvable');
      return m;
    },
    async create(
      data: { moduleId: string; enseignantId?: string; nom: string; code: string; coefficient: number; creditsEcts: number },
      adminId: string,
    ) {
      const created = await structuresRepository.matiere.create({
        nom: data.nom,
        code: data.code,
        coefficient: data.coefficient,
        creditsEcts: data.creditsEcts,
        module: { connect: { id: data.moduleId } },
        ...(data.enseignantId ? { enseignant: { connect: { utilisateurId: data.enseignantId } } } : {}),
      });
      await recordAudit({ utilisateurId: adminId, action: 'CREATE', entite: 'Matiere', entiteId: created.id, donneesApres: created });
      return created;
    },
    async update(
      id: string,
      data: Partial<{ nom: string; code: string; coefficient: number; creditsEcts: number; enseignantId: string | null }>,
      adminId: string,
    ) {
      const avant = await structuresService.matiere.get(id);
      const { enseignantId, ...rest } = data;
      const updated = await structuresRepository.matiere.update(id, {
        ...rest,
        ...(enseignantId !== undefined
          ? { enseignant: enseignantId ? { connect: { utilisateurId: enseignantId } } : { disconnect: true } }
          : {}),
      });
      await recordAudit({ utilisateurId: adminId, action: 'UPDATE', entite: 'Matiere', entiteId: id, donneesAvant: avant, donneesApres: updated });
      return updated;
    },
    async remove(id: string, adminId: string) {
      await structuresService.matiere.get(id);
      await structuresRepository.matiere.remove(id);
      await recordAudit({ utilisateurId: adminId, action: 'DELETE', entite: 'Matiere', entiteId: id });
    },
  },

  salle: {
    list: (type?: TypeSalle) => structuresRepository.salle.findAll(type),
    get: async (id: string) => {
      const s = await structuresRepository.salle.findById(id);
      if (!s) throw ApiError.notFound('Salle introuvable');
      return s;
    },
    async create(data: { nom: string; capacite: number; type: TypeSalle; batiment?: string }, adminId: string) {
      const created = await structuresRepository.salle.create(data);
      await recordAudit({ utilisateurId: adminId, action: 'CREATE', entite: 'Salle', entiteId: created.id, donneesApres: created });
      return created;
    },
    async update(id: string, data: Partial<{ nom: string; capacite: number; type: TypeSalle; batiment: string }>, adminId: string) {
      const avant = await structuresService.salle.get(id);
      const updated = await structuresRepository.salle.update(id, data);
      await recordAudit({ utilisateurId: adminId, action: 'UPDATE', entite: 'Salle', entiteId: id, donneesAvant: avant, donneesApres: updated });
      return updated;
    },
    async remove(id: string, adminId: string) {
      await structuresService.salle.get(id);
      await structuresRepository.salle.remove(id);
      await recordAudit({ utilisateurId: adminId, action: 'DELETE', entite: 'Salle', entiteId: id });
    },
  },
};
