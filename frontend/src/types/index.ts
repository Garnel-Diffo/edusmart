// ============================================================
// Types TypeScript partagés - miroir des entités Prisma/backend
// ============================================================

export type Role = 'ETUDIANT' | 'ENSEIGNANT' | 'ADMIN_SCOLAIRE' | 'DIRECTION' | 'SUPER_ADMIN';
export type StatutCompte = 'ACTIF' | 'DESACTIVE' | 'VERROUILLE';

export interface User {
  id: string;
  email: string;
  nom: string;
  prenom: string;
  role: Role;
  telephone: string | null;
  avatarUrl: string | null;
  statutCompte: StatutCompte;
  emailVerifie: boolean;
  derniereConnexion: string | null;
  createdAt: string;
  etudiant?: Etudiant | null;
  enseignant?: Enseignant | null;
  adminScolaire?: AdminScolaire | null;
}

export interface Etudiant {
  utilisateurId: string;
  matricule: string;
  anneeEntree: number;
  estDelegue: boolean;
  inscriptions?: { filiere: Filiere }[];
}

export interface Enseignant {
  utilisateurId: string;
  specialite: string | null;
  grade: string | null;
}

export interface AdminScolaire {
  utilisateurId: string;
  fonction: string | null;
  superAdmin: boolean;
}

export interface Salle {
  id: string;
  nom: string;
  capacite: number;
  type: 'AMPHITHEATRE' | 'LABO' | 'SALLE_COURS';
  batiment: string | null;
}

export interface Filiere {
  id: string;
  nom: string;
  code: string;
  niveau: string;
  cycle: string;
  description: string | null;
  salleAttitreeId: string | null;
  salleAttitree?: Salle | null;
}

export interface Module {
  id: string;
  filiereId: string;
  nom: string;
  code: string;
  semestre: number;
  creditsEcts: number;
  filiere?: Filiere;
}

export interface Matiere {
  id: string;
  moduleId: string;
  enseignantId: string | null;
  nom: string;
  code: string;
  coefficient: number;
  creditsEcts: number;
  module?: Module;
}

export interface CoursDocument {
  id: string;
  matiereId: string;
  titre: string;
  nomFichier: string;
  format: 'PDF' | 'PPTX' | 'DOCX';
  tailleOctets: number;
  cloudinaryUrl: string;
  statutIndexation: 'NON_INDEXE' | 'EN_COURS' | 'INDEXE' | 'ERREUR';
  dateDepot: string;
  nbTelechargements: number;
  matiere?: Matiere;
  enseignant?: { utilisateur: { nom: string; prenom: string } };
}

export interface EmploiDuTemps {
  id: string;
  filiereId: string;
  semestre: number;
  anneeScolaire: string;
  titre: string | null;
  format: 'PDF' | 'IMAGE';
  cloudinaryUrl: string;
  createdAt: string;
}

export type TypeEvaluation = 'CONTROLE' | 'EXAMEN' | 'TP' | 'PROJET';
export type Mention = 'EXCELLENT' | 'TRES_BIEN' | 'BIEN' | 'ASSEZ_BIEN' | 'PASSABLE' | 'AJOURNE';

export interface NoteMatiere {
  matiereId: string;
  nom: string;
  code: string;
  coefficient: number;
  creditsEcts: number;
  moyenne: number;
}

export interface EtudiantInscrit {
  utilisateurId: string;
  matricule: string;
  utilisateur: { nom: string; prenom: string };
}

export interface SessionEnAttente {
  matiereId: string;
  semestre: number;
  anneeScolaire: string;
  nbNotesEnAttente: number;
  matiere?: { id: string; nom: string; code: string; module: { nom: string; filiere: { nom: string } } };
}

export interface NotesResult {
  matieres: NoteMatiere[];
  moyenneGenerale: number;
  rang: number | null;
  effectifPromotion: number;
}

export interface BulletinSemestre {
  id: string;
  etudiantId: string;
  semestre: number;
  anneeScolaire: string;
  moyenneGenerale: number;
  rang: number | null;
  mention: Mention;
  pdfCloudinaryUrl: string | null;
  genereLe: string;
}

export interface Annonce {
  id: string;
  auteurId: string;
  titre: string;
  contenu: string;
  cible: 'TOUS' | 'FILIERE' | 'MODULE' | 'ETUDIANT';
  datePublication: string;
  auteur: { nom: string; prenom: string; role: Role };
  filiere?: { nom: string } | null;
  module?: { nom: string } | null;
  fichierUrl?: string | null;
  fichierNomOriginal?: string | null;
  fichierFormat?: string | null;
  fichierTailleOctets?: number | null;
}

export interface Notification {
  id: string;
  type: string;
  titre: string;
  contenu: string;
  lien: string | null;
  estLue: boolean;
  canal: string;
  envoyeLe: string | null;
  createdAt: string;
}

export interface CanalDiscussion {
  id: string;
  moduleId: string;
  nom: string;
  estActif: boolean;
  module: { id: string; nom: string; code: string };
}

export interface Message {
  id: string;
  canalId: string;
  contenu: string;
  estSignale: boolean;
  createdAt: string;
  auteur: { id: string; nom: string; prenom: string; avatarUrl: string | null };
}

export interface SourceDocument {
  coursDocumentId: string;
  titre: string;
  extrait: string;
  score: number;
}

export type ModeReponse = 'COURS' | 'CONNAISSANCES_GENERALES';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  sources?: SourceDocument[];
  modeReponse?: ModeReponse;
  modeDegrade?: boolean;
  timestamp: string;
}

export interface FicheRevision {
  id: string;
  type: 'FICHE_RESUME' | 'RESUME_DETAILLE' | 'QUIZ_QCM';
  statut: 'EN_COURS' | 'PRET' | 'ECHEC';
  contenuGenere: string | null;
  pdfCloudinaryUrl: string | null;
  genereLe: string | null;
  createdAt: string;
}

export interface DocumentPersonnel {
  id: string;
  titre: string;
  nomFichier: string;
  format: 'PDF' | 'PPTX' | 'DOCX' | 'IMAGE';
  tailleOctets: number;
  statutIndexation: 'NON_INDEXE' | 'EN_COURS' | 'INDEXE' | 'ERREUR';
  createdAt: string;
}

export interface StatFiliere {
  filiereId: string;
  nom: string;
  effectif: number;
  tauxReussite: number;
  moyenneGenerale: number;
}

export interface DashboardStats {
  parFiliere: StatFiliere[];
  nbCoursDeposes: number;
  activiteChatbot: number;
  utilisateursActifs: number;
  repartitionRoles: { role: string; total: number }[];
  genereLe: string;
}

// Auth
export interface LoginResponse {
  success: boolean;
  accessToken: string;
  user: User;
}

// API pagination
export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: { page: number; pageSize: number; total: number; totalPages: number };
}
