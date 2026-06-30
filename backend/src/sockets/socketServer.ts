import type { Server as HttpServer } from 'http';
import { Server, type Socket } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { verifyAccessToken } from '@/utils/jwt';
import { redis } from '@/config/redis';
import { corsAllowedOrigins } from '@/config/env';
import { logger } from '@/config/logger';
import { rooms } from '@/sockets/rooms';
import { registerMessagerieHandlers } from '@/modules/messagerie/messagerie.socket';

let io: Server | undefined;

export function getIO(): Server {
  if (!io) throw new Error('Socket.io server non initialisé');
  return io;
}

/**
 * Initialise le serveur Socket.io avec l'adaptateur Redis (Upstash) pour
 * permettre la diffusion d'événements même avec plusieurs instances Render.
 * Chaque connexion est authentifiée par JWT (handshake.auth.token) et rejoint
 * automatiquement sa room personnelle `user:<id>` pour les notifications.
 */
export async function initSocketServer(httpServer: HttpServer): Promise<Server> {
  io = new Server(httpServer, {
    cors: { origin: corsAllowedOrigins, credentials: true },
    pingInterval: 25_000,
    pingTimeout: 20_000,
  });

  const pubClient = redis.duplicate();
  const subClient = redis.duplicate();
  io.adapter(createAdapter(pubClient, subClient));

  io.use((socket: Socket, next) => {
    const token = socket.handshake.auth?.token as string | undefined;
    if (!token) return next(new Error('UNAUTHORIZED'));
    try {
      const payload = verifyAccessToken(token);
      socket.data.user = { id: payload.sub, email: payload.email, role: payload.role };
      next();
    } catch {
      next(new Error('UNAUTHORIZED'));
    }
  });

  io.on('connection', (socket: Socket) => {
    const user = socket.data.user as { id: string; role: string };
    socket.join(rooms.user(user.id));
    logger.debug({ userId: user.id, socketId: socket.id }, 'Connexion Socket.io établie');

    registerMessagerieHandlers(io as Server, socket);

    socket.on('disconnect', () => {
      logger.debug({ userId: user.id, socketId: socket.id }, 'Déconnexion Socket.io');
    });
  });

  logger.info('✅ Serveur Socket.io initialisé (adaptateur Redis)');
  return io;
}
