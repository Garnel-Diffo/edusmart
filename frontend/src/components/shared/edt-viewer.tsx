import { FileText, CalendarX } from 'lucide-react';
import type { EmploiDuTemps } from '@/types';

export function EdtViewer({
  edt,
  emptyMessage = "Emploi du temps non encore disponible pour cette période.",
}: {
  edt: EmploiDuTemps | null | undefined;
  emptyMessage?: string;
}) {
  if (!edt) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed py-16 text-center text-muted-foreground">
        <CalendarX className="h-8 w-8" />
        <p>{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border bg-card">
      {edt.titre && <div className="border-b px-4 py-2 text-sm font-medium">{edt.titre}</div>}
      {edt.format === 'IMAGE' ? (
        // eslint-disable-next-line @next/next/no-img-element -- image Cloudinary externe, pas d'optimisation Next nécessaire ici
        <img src={edt.cloudinaryUrl} alt="Emploi du temps" className="w-full" />
      ) : (
        <a
          href={edt.cloudinaryUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex flex-col items-center gap-3 p-10 text-sm font-medium text-primary hover:bg-accent"
        >
          <FileText className="h-10 w-10" />
          Ouvrir le PDF de l&apos;emploi du temps
        </a>
      )}
    </div>
  );
}
