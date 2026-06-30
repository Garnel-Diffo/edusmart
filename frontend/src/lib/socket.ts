'use client';

import { io, type Socket } from 'socket.io-client';

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL ?? 'http://localhost:4000';

let socket: Socket | null = null;

export function getSocket(): Socket | null {
  return socket;
}

export function connectSocket(accessToken: string): Socket {
  if (socket?.connected) return socket;

  socket = io(SOCKET_URL, {
    auth: { token: accessToken },
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 1_000,
  });

  socket.on('connect', () => console.info('[Socket.io] Connecté'));
  socket.on('disconnect', (reason) => console.info('[Socket.io] Déconnecté :', reason));
  socket.on('connect_error', (err) => console.error('[Socket.io] Erreur :', err.message));

  return socket;
}

export function disconnectSocket(): void {
  socket?.disconnect();
  socket = null;
}
