import type { Request, Response } from 'express';
import { asyncHandler } from '@/utils/asyncHandler';
import { statsService } from '@/modules/stats/stats.service';
import { renderHtmlToPdf } from '@/utils/pdfGenerator';
import { statsDashboardHtml } from '@/utils/documentTemplates';
import { env } from '@/config/env';

export const statsController = {
  getDashboard: asyncHandler(async (req: Request, res: Response) => {
    const { filiereId, semestre, anneeScolaire, format } = req.query as unknown as {
      filiereId?: string;
      semestre?: number;
      anneeScolaire?: string;
      format: 'json' | 'csv' | 'pdf';
    };
    const dashboard = await statsService.getDashboard({ filiereId, semestre, anneeScolaire });

    if (format === 'csv') {
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', 'attachment; filename="statistiques-edusmart.csv"');
      return res.send(statsService.toCsv(dashboard));
    }

    if (format === 'pdf') {
      const html = statsDashboardHtml({ etablissement: env.ETABLISSEMENT_NOM, ...dashboard });
      const pdf = await renderHtmlToPdf(html);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename="statistiques-edusmart.pdf"');
      return res.send(pdf);
    }

    res.json({ success: true, data: dashboard });
  }),
};
