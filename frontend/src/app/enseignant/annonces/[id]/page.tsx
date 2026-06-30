import { AnnonceDetail } from '@/components/annonces/annonce-detail';

export default function EnseignantAnnonceDetailPage({ params }: { params: { id: string } }) {
  return <AnnonceDetail id={params.id} backHref="/enseignant/annonces" />;
}
