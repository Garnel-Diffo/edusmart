import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:4000';

export const api = axios.create({
  baseURL: `${BACKEND_URL}/api`,
  withCredentials: true, // envoie les cookies (refresh token HttpOnly)
  timeout: 30_000,
});

let accessToken: string | null = null;
let isRefreshing = false;
let refreshQueue: Array<{ resolve: (token: string) => void; reject: (e: unknown) => void }> = [];

export function setAccessToken(token: string | null) {
  accessToken = token;
}

export function getAccessToken() {
  return accessToken;
}

// Ajoute le token JWT à chaque requête
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (accessToken && config.headers) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

/**
 * Endpoints volontairement exclus du mécanisme de refresh automatique :
 * - /auth/login : un 401 signifie "identifiants invalides", pas un token expiré.
 * - /auth/refresh : c'est le refresh lui-même ; le ré-intercepter créerait une
 *   boucle. L'absence de session au montage de l'app (visiteur non connecté)
 *   est un état normal, pas une erreur à traiter ici - `refreshSession()` s'en
 *   charge silencieusement côté appelant (voir hooks/use-auth.ts).
 */
const EXCLUDED_FROM_REFRESH = ['/auth/login', '/auth/refresh'];

// Gère le rafraîchissement automatique du token expiré (HTTP 401)
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
    const isExcluded = EXCLUDED_FROM_REFRESH.some((p) => originalRequest.url?.includes(p));

    if (error.response?.status !== 401 || originalRequest._retry || isExcluded) {
      return Promise.reject(error);
    }
    originalRequest._retry = true;

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        refreshQueue.push({ resolve, reject });
      }).then((token) => {
        originalRequest.headers.Authorization = `Bearer ${token}`;
        return api(originalRequest);
      });
    }

    isRefreshing = true;
    try {
      const { data } = await axios.post<{ accessToken: string }>(`${BACKEND_URL}/api/auth/refresh`, {}, {
        withCredentials: true,
        timeout: 10_000,
      });
      setAccessToken(data.accessToken);
      refreshQueue.forEach((q) => q.resolve(data.accessToken));
      refreshQueue = [];
      originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
      return api(originalRequest);
    } catch (refreshError) {
      refreshQueue.forEach((q) => q.reject(refreshError));
      refreshQueue = [];
      setAccessToken(null);
      // Synchronise le store Zustand : DashboardShell observe `user` et
      // navigue côté client vers /login dès qu'il devient null (pas de
      // rechargement de page, pas de requêtes en cours interrompues).
      const { useAuthStore } = await import('@/lib/auth-store');
      useAuthStore.getState().clearAuth();
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  },
);

// Raccourcis API par domaine
export const authApi = {
  login: (email: string, motDePasse: string) =>
    api.post('/auth/login', { email, motDePasse }),
  logout: () => api.post('/auth/logout'),
  refresh: () => api.post('/auth/refresh'),
  me: () => api.get('/auth/me'),
  forgotPassword: (email: string) => api.post('/auth/forgot-password', { email }),
  resetPassword: (token: string, nouveauMotDePasse: string) =>
    api.post('/auth/reset-password', { token, nouveauMotDePasse }),
  changePassword: (ancienMotDePasse: string, nouveauMotDePasse: string) =>
    api.post('/auth/change-password', { ancienMotDePasse, nouveauMotDePasse }),
  updateMe: (data: { nom?: string; prenom?: string; telephone?: string }) => api.put('/auth/me', data),
  uploadAvatar: (formData: FormData) =>
    api.post('/auth/avatar', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
};

export const coursApi = {
  list: (params?: Record<string, unknown>) => api.get('/cours', { params }),
  download: (id: string) => api.get(`/cours/${id}/download`),
  upload: (formData: FormData) =>
    api.post('/cours/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
};

export const edtApi = {
  get: (params: Record<string, unknown>) => api.get('/edt', { params }),
  upload: (formData: FormData) => api.post('/edt', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
};

export const notesApi = {
  etudiant: (semestre: number, anneeScolaire: string) =>
    api.get('/notes/etudiant', { params: { semestre, anneeScolaire } }),
  bulletin: (semestre: number, anneeScolaire: string) =>
    api.get('/notes/bulletin', { params: { semestre, anneeScolaire } }),
  listEtudiants: (matiereId: string) => api.get('/notes/etudiants', { params: { matiereId } }),
  saisir: (data: unknown) => api.post('/notes/saisir', data),
  sessionsEnAttente: () => api.get('/notes/sessions-en-attente'),
  valider: (data: unknown) => api.put('/notes/valider', data),
  refuser: (data: unknown) => api.put('/notes/refuser', data),
};

export const bulletinsApi = {
  generer: (data: unknown) => api.post('/admin/bulletins/generer', data),
};

export const annoncesApi = {
  list: (params?: Record<string, unknown>) => api.get('/annonces', { params }),
  publier: (formData: FormData) => api.post('/annonces', formData),
};

export const messagerieApi = {
  canaux: () => api.get('/messages/canaux'),
  historique: (canalId: string) => api.get(`/messages/canaux/${canalId}/historique`),
};

export const notificationsApi = {
  list: (params?: Record<string, unknown>) => api.get('/notifications', { params }),
  countNonLues: () => api.get('/notifications/non-lues/count'),
  markLue: (id: string) => api.put(`/notifications/${id}/lue`),
  markToutesLues: () => api.put('/notifications/lues/toutes'),
};

export const statsApi = {
  dashboard: (params?: Record<string, unknown>) => api.get('/stats', { params }),
};

export const iaApi = {
  chat: (question: string) => api.post('/ia/chat', { question }),
  search: (requete: string) => api.post('/ia/search', { requete }),
  genererFiche: (data: unknown) => api.post('/ia/fiche', data),
  getFiche: (id: string) => api.get(`/ia/fiche/${id}`),
  exporterFichePdf: (id: string) => api.get(`/ia/fiche/${id}/pdf`),
};

export const documentsPersonnelsApi = {
  list: () => api.get('/documents-personnels'),
  upload: (formData: FormData) =>
    api.post('/documents-personnels/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
};

export const adminApi = {
  users: {
    list: (params?: Record<string, unknown>) => api.get('/admin/utilisateurs', { params }),
    get: (id: string) => api.get(`/admin/utilisateurs/${id}`),
    create: (data: unknown) => api.post('/admin/utilisateurs', data),
    update: (id: string, data: unknown) => api.put(`/admin/utilisateurs/${id}`, data),
    setDelegue: (id: string, estDelegue: boolean) => api.put(`/admin/utilisateurs/${id}/delegue`, { estDelegue }),
  },
  inscriptions: {
    create: (data: unknown) => api.post('/admin/inscriptions', data),
  },
  structures: {
    filieres: {
      list: () => api.get('/structures/filieres'),
      create: (data: unknown) => api.post('/structures/filieres', data),
      update: (id: string, data: unknown) => api.put(`/structures/filieres/${id}`, data),
    },
    modules: {
      list: (filiereId?: string) => api.get('/structures/modules', { params: { filiereId } }),
      create: (data: unknown) => api.post('/structures/modules', data),
    },
    matieres: {
      list: (moduleId?: string) => api.get('/structures/matieres', { params: { moduleId } }),
      create: (data: unknown) => api.post('/structures/matieres', data),
      update: (id: string, data: unknown) => api.put(`/structures/matieres/${id}`, data),
    },
    salles: {
      list: () => api.get('/structures/salles'),
      create: (data: unknown) => api.post('/structures/salles', data),
    },
  },
};
