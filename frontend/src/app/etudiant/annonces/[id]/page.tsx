import { AnnonceDetail } from '@/components/annonces/annonce-detail';

export default function EtudiantAnnonceDetailPage({ params }: { params: { id: string } }) {
  return <AnnonceDetail id={params.id} backHref="/etudiant/annonces" />;
}
