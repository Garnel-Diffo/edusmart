import type { Server, Socket } from 'socket.io';
import { messagerieService } from '@/modules/messagerie/messagerie.service';
import { rooms, SOCKET_EVENTS } from '@/sockets/rooms';
import { logger } from '@/config/logger';

/** Nombre de connexions actuellement présentes dans la room d'un canal (multi-onglets compris). */
function presenceCount(io: Server, canalId: string): number {
  return io.sockets.adapter.rooms.get(rooms.canal(canalId))?.size ?? 0;
}

function broadcastPresence(io: Server, canalId: string): void {
  io.to(rooms.canal(canalId)).emit('canal:presence', { canalId, count: presenceCount(io, canalId) });
}

/**
 * Gestion temps réel du chat entre étudiants (UC19). Latence cible < 500 ms :
 * le message est persisté puis diffusé immédiatement à la room du canal, sans
 * attendre de file d'attente (contrairement aux notifications, qui tolèrent un
 * léger différé).
 */
export function registerMessagerieHandlers(io: Server, socket: Socket): void {
  const user = socket.data.user as { id: string; role: string };
  const canauxRejoints = new Set<string>();

  socket.on('canal:join', async (canalId: string) => {
    socket.join(rooms.canal(canalId));
    canauxRejoints.add(canalId);
    // Présence approximative (UC19 : accusé "✓✓" = au moins un autre membre a le canal ouvert),
    // pas un accusé de lecture message par message - aucune persistance requise.
    broadcastPresence(io, canalId);
  });

  socket.on('canal:leave', (canalId: string) => {
    socket.leave(rooms.canal(canalId));
    canauxRejoints.delete(canalId);
    broadcastPresence(io, canalId);
  });

  socket.on('disconnect', () => {
    // Socket.io a déjà retiré ce socket de ses rooms à ce stade : le décompte
    // reflète directement l'état post-départ.
    for (const canalId of canauxRejoints) broadcastPresence(io, canalId);
  });

  /**
   * Indicateur "en train d'écrire..." - diffusion éphémère aux autres membres
   * du canal uniquement (pas de persistance, pas de vérification d'inscription :
   * la room elle-même n'est accessible qu'après un `canal:join` réussi côté
   * client, qui suppose déjà un historique chargé via l'API REST authentifiée).
   */
  socket.on('canal:typing', (payload: { canalId: string; prenom: string }) => {
    socket.to(rooms.canal(payload.canalId)).emit('canal:typing', { userId: user.id, prenom: payload.prenom });
  });

  socket.on('message:send', async (payload: { canalId: string; contenu: string }, ack?: (res: unknown) => void) => {
    try {
      if (user.role !== 'ETUDIANT') {
        throw new Error('Seuls les étudiants peuvent participer à ce canal');
      }
      const message = await messagerieService.envoyerMessage(user.id, payload.canalId, payload.contenu);
      io.to(rooms.canal(payload.canalId)).emit(SOCKET_EVENTS.MESSAGE_NEW, message);
      ack?.({ success: true, message });
    } catch (err) {
      logger.warn({ err, userId: user.id }, 'Échec envoi message messagerie');
      ack?.({ success: false, error: err instanceof Error ? err.message : 'Erreur inconnue' });
    }
  });

  socket.on('message:signaler', async (payload: { canalId: string; messageId: string }, ack?: (res: unknown) => void) => {
    try {
      const message = await messagerieService.signalerMessage(user.id, payload.canalId, payload.messageId);
      io.to(rooms.canal(payload.canalId)).emit(SOCKET_EVENTS.MESSAGE_FLAGGED, { messageId: message.id });
      ack?.({ success: true });
    } catch (err) {
      ack?.({ success: false, error: err instanceof Error ? err.message : 'Erreur inconnue' });
    }
  });
}
