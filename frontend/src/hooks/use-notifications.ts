'use client';

import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { getSocket } from '@/lib/socket';

/** Écoute les événements Socket.io de notification en temps réel et invalide
 *  le cache React Query correspondant pour que la cloche se mette à jour. */
export function useNotifications() {
  const qc = useQueryClient();
  const attached = useRef(false);

  useEffect(() => {
    const socket = getSocket();
    if (!socket || attached.current) return;
    attached.current = true;

    socket.on('notification:new', (notification: { titre: string; contenu: string }) => {
      toast.info(notification.titre, { description: notification.contenu.slice(0, 120) });
      qc.invalidateQueries({ queryKey: ['notifications'] });
    });

    socket.on('notes:validated', () => {
      toast.success('Vos notes ont été publiées !');
      qc.invalidateQueries({ queryKey: ['notes'] });
    });

    socket.on('edt:updated', () => {
      toast.info("L'emploi du temps a été mis à jour");
      qc.invalidateQueries({ queryKey: ['edt'] });
    });

    socket.on('cours:new', ({ titre }: { titre: string }) => {
      toast.success(`Nouveau cours disponible : ${titre}`);
      qc.invalidateQueries({ queryKey: ['cours'] });
    });

    return () => {
      attached.current = false;
      socket.off('notification:new');
      socket.off('notes:validated');
      socket.off('edt:updated');
      socket.off('cours:new');
    };
  }, [qc]);
}
