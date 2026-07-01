import { auditRepository, type AuditFilters } from '@/modules/audit/audit.repository';
import { parsePagination, buildPaginatedResult, type PaginationQuery } from '@/utils/pagination';

export const auditService = {
  async list(filters: AuditFilters, query: PaginationQuery) {
    const { page, pageSize, skip, take } = parsePagination(query);
    const [data, total] = await auditRepository.findMany(filters, skip, take);
    return buildPaginatedResult(data, total, page, pageSize);
  },

  async getFilterOptions() {
    const [actions, entites] = await Promise.all([
      auditRepository.distinctActions(),
      auditRepository.distinctEntites(),
    ]);
    return {
      actions: actions.map((a) => a.action),
      entites: entites.map((e) => e.entite),
    };
  },
};
