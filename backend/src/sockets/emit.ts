import { getIO } from '@/sockets/socketServer';
import { rooms } from '@/sockets/rooms';

export function emitToUser(userId: string, event: string, payload: unknown): void {
  getIO().to(rooms.user(userId)).emit(event, payload);
}

export function emitToCanal(canalId: string, event: string, payload: unknown): void {
  getIO().to(rooms.canal(canalId)).emit(event, payload);
}

export function emitToFiliere(filiereId: string, event: string, payload: unknown): void {
  getIO().to(rooms.filiere(filiereId)).emit(event, payload);
}
