import axios from 'axios';
import { env } from '@/config/env';
import { logger } from '@/config/logger';

/**
 * Client HTTP interne vers le micro-service Python FastAPI (jamais exposé
 * directement au frontend). Authentifié par un secret partagé (AI_SERVICE_SECRET)
 * transmis dans l'en-tête `X-Internal-Secret`.
 */
const aiClient = axios.create({
  baseURL: env.AI_SERVICE_URL,
  timeout: 30_000, // UC13 NFR : timeout chatbot à 30s
  headers: { 'X-Internal-Secret': env.AI_SERVICE_SECRET },
});

export interface IndexationRequest {
  coursDocumentId: string;
  cloudinaryUrl: string;
  format: 'PDF' | 'PPTX' | 'DOCX';
}

export interface IndexationPersonnelleRequest {
  documentPersonnelId: string;
  cloudinaryUrl: string;
  format: 'PDF' | 'PPTX' | 'DOCX' | 'IMAGE';
}

export interface ChatRequest {
  question: string;
  filiereId: string;
  utilisateurId: string;
}

export interface ChatResponse {
  reponse: string;
  sources: { coursDocumentId: string; titre: string; extrait: string; score: number }[];
  modeReponse: 'COURS' | 'CONNAISSANCES_GENERALES';
  modeDegrade: boolean;
}

export interface SearchRequest {
  requete: string;
  filiereId: string;
}

export interface SearchResult {
  coursDocumentId: string;
  titre: string;
  extrait: string;
  score: number;
}

export interface FicheRequest {
  ficheRevisionId: string;
  type: 'FICHE_RESUME' | 'RESUME_DETAILLE' | 'QUIZ_QCM';
  matiereId?: string;
  moduleId?: string;
  coursDocumentId?: string;
  documentPersonnelId?: string;
}

export const aiServiceClient = {
  async declencherIndexation(payload: IndexationRequest): Promise<void> {
    await aiClient.post('/ia/index', payload, { timeout: 120_000 });
  },

  async declencherIndexationPersonnelle(payload: IndexationPersonnelleRequest): Promise<void> {
    await aiClient.post('/ia/index-personnel', payload, { timeout: 15_000 }); // OCR vision plus lent qu'une extraction de texte classique
  },

  async chat(payload: ChatRequest): Promise<ChatResponse> {
    const { data } = await aiClient.post<ChatResponse>('/ia/chat', payload);
    return data;
  },

  async search(payload: SearchRequest): Promise<SearchResult[]> {
    const { data } = await aiClient.post<{ resultats: SearchResult[] }>('/ia/search', payload);
    return data.resultats;
  },

  async genererFiche(payload: FicheRequest): Promise<void> {
    // Traitement asynchrone côté service IA : la réponse est envoyée plus tard
    // (notification + mise à jour du statut en base) si elle dépasse 60s (UC14 - E1).
    await aiClient.post('/ia/fiche', payload, { timeout: 5_000 }).catch((err) => {
      logger.error({ err, payload }, "Échec du déclenchement de la génération de fiche IA");
      throw err;
    });
  },
};

export function isAiServiceUnavailableError(err: unknown): boolean {
  return axios.isAxiosError(err) && (err.code === 'ECONNREFUSED' || err.code === 'ETIMEDOUT' || !err.response);
}
