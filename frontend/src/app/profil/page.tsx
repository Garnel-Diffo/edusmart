'use client';

import { useRef, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Camera, Save } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/use-auth';
import { useAuthStore } from '@/lib/auth-store';
import { authApi } from '@/lib/api';
import { PageHeader } from '@/components/shared/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { getInitials, roleLabel } from '@/lib/utils';

export default function ProfilPage() {
  const { user } = useAuth();
  const updateUser = useAuthStore((s) => s.updateUser);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [nom, setNom] = useState(user?.nom ?? '');
  const [prenom, setPrenom] = useState(user?.prenom ?? '');
  const [telephone, setTelephone] = useState(user?.telephone ?? '');

  const updateMutation = useMutation({
    mutationFn: () => authApi.updateMe({ nom, prenom, telephone: telephone || undefined }),
    onSuccess: ({ data }) => {
      updateUser(data.user);
      toast.success('Profil mis à jour');
    },
    onError: () => toast.error('Échec de la mise à jour'),
  });

  const avatarMutation = useMutation({
    mutationFn: (file: File) => {
      const formData = new FormData();
      formData.append('avatar', file);
      return authApi.uploadAvatar(formData);
    },
    onSuccess: ({ data }) => {
      updateUser(data.user);
      toast.success('Photo de profil mise à jour');
    },
    onError: () => toast.error("Échec de l'envoi de l'image"),
  });

  if (!user) return null;

  return (
    <div>
      <PageHeader title="Mon profil" description="Vos informations personnelles" />

      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <Card className="h-fit">
          <CardContent className="flex flex-col items-center gap-3 p-6 text-center">
            <div className="relative">
              <Avatar className="h-24 w-24 border">
                {user.avatarUrl && <AvatarImage src={user.avatarUrl} alt={user.prenom} />}
                <AvatarFallback className="text-xl">{getInitials(user.nom, user.prenom)}</AvatarFallback>
              </Avatar>
              <button
                type="button"
                onClick={() => avatarInputRef.current?.click()}
                className="absolute bottom-0 right-0 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground shadow hover:opacity-90"
                aria-label="Changer la photo de profil"
              >
                <Camera className="h-4 w-4" />
              </button>
              <input
                ref={avatarInputRef}
                type="file"
                hidden
                accept="image/*"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) avatarMutation.mutate(f); }}
              />
            </div>
            <div>
              <p className="font-semibold">{user.prenom} {user.nom}</p>
              <p className="text-xs text-muted-foreground">{roleLabel(user.role)}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-4 p-5">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2"><Label>Prénom</Label><Input value={prenom} onChange={(e) => setPrenom(e.target.value)} /></div>
              <div className="space-y-2"><Label>Nom</Label><Input value={nom} onChange={(e) => setNom(e.target.value)} /></div>
            </div>
            <div className="space-y-2"><Label>Téléphone</Label><Input value={telephone} onChange={(e) => setTelephone(e.target.value)} placeholder="Optionnel" /></div>
            <div className="space-y-2"><Label>Email</Label><Input value={user.email} disabled /></div>
            {user.etudiant && <div className="space-y-2"><Label>Matricule</Label><Input value={user.etudiant.matricule} disabled /></div>}

            <Button loading={updateMutation.isPending} disabled={!nom || !prenom} onClick={() => updateMutation.mutate()}>
              <Save className="h-4 w-4" /> Enregistrer
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
