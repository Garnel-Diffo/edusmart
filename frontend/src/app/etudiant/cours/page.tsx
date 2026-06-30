'use client';

import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Download, FileText, FileType2, Presentation } from 'lucide-react';
import { toast } from 'sonner';
import { coursApi } from '@/lib/api';
import { PageHeader } from '@/components/shared/page-header';
import { EmptyState } from '@/components/shared/empty-state';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatBytes, formatDate } from '@/lib/utils';
import type { CoursDocument, PaginatedResponse } from '@/types';

const FORMAT_ICON = { PDF: FileText, PPTX: Presentation, DOCX: FileType2 } as const;

export default function EtudiantCoursPage() {
  const [page] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['cours', page],
    queryFn: () => coursApi.list({ page, pageSize: 24 }).then((r) => r.data as PaginatedResponse<CoursDocument>),
  });

  const downloadMutation = useMutation({
    mutationFn: (id: string) => coursApi.download(id).then((r) => r.data.data as { url: string; nomFichier: string }),
    onSuccess: (result) => {
      window.open(result.url, '_blank');
    },
    onError: () => toast.error('Impossible de télécharger ce document'),
  });

  return (
    <div>
      <PageHeader title="Mes cours" description="Supports de cours déposés par vos enseignants" />

      {isLoading && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-36 w-full" />
          ))}
        </div>
      )}

      {!isLoading && data?.data.length === 0 && (
        <EmptyState icon={FileText} title="Aucun cours disponible" description="Aucun document n'a encore été déposé pour votre filière." />
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {data?.data.map((doc, i) => {
          const Icon = FORMAT_ICON[doc.format];
          return (
            <motion.div key={doc.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
              <Card className="flex h-full flex-col transition-shadow hover:shadow-md">
                <CardContent className="flex flex-1 flex-col p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Icon className="h-5 w-5" />
                    </div>
                    <Badge variant="outline">{doc.format}</Badge>
                  </div>
                  <p className="mt-3 line-clamp-2 font-medium leading-snug">{doc.titre}</p>
                  <p className="text-xs text-muted-foreground">{doc.matiere?.nom}</p>
                  <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                    <span>{formatBytes(doc.tailleOctets)}</span>
                    <span>{formatDate(doc.dateDepot)}</span>
                  </div>
                  <Button
                    className="mt-4 w-full"
                    variant="secondary"
                    size="sm"
                    loading={downloadMutation.isPending && downloadMutation.variables === doc.id}
                    onClick={() => downloadMutation.mutate(doc.id)}
                  >
                    <Download className="h-4 w-4" /> Télécharger
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
