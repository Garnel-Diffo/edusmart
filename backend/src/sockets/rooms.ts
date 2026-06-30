/** Conventions de nommage des rooms Socket.io, partagées par tous les modules. */
export const rooms = {
  user: (userId: string) => `user:${userId}`,
  canal: (canalId: string) => `canal:${canalId}`,
  filiere: (filiereId: string) => `filiere:${filiereId}`,
};

export const SOCKET_EVENTS = {
  MESSAGE_NEW: 'message:new',
  MESSAGE_FLAGGED: 'message:flagged',
  NOTIFICATION_NEW: 'notification:new',
  EDT_UPDATED: 'edt:updated',
  NOTES_VALIDATED: 'notes:validated',
  COURS_NEW: 'cours:new',
  ANNONCE_NEW: 'annonce:new',
} as const;
