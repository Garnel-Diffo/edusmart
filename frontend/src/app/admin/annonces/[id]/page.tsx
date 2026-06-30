import { AnnonceDetail } from '@/components/annonces/annonce-detail';

export default function AdminAnnonceDetailPage({ params }: { params: { id: string } }) {
  return <AnnonceDetail id={params.id} backHref="/admin/annonces" />;
}
