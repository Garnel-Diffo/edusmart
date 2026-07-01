# Référence API - Backend EduSmart

Base URL locale : `http://localhost:4000/api`
Base URL production : `https://<votre-service>.onrender.com/api`

Toutes les routes (sauf `/auth/login`, `/auth/refresh`, `/auth/forgot-password`,
`/auth/reset-password` et `/health`) exigent un header :

```
Authorization: Bearer <accessToken>
```

L'`accessToken` est obtenu via `POST /auth/login` ou `POST /auth/refresh` (qui lit le
refresh token depuis un cookie `HttpOnly`). Toutes les réponses suivent l'enveloppe :

```json
{ "success": true, "data": { ... } }
// ou en cas d'erreur :
{ "success": false, "error": { "code": "...", "message": "...", "details": {} } }
```

## Sommaire

- [Authentification](#authentification)
- [Administration (utilisateurs & inscriptions)](#administration)
- [Structures académiques](#structures-académiques)
- [Cours](#cours)
- [Emploi du temps](#emploi-du-temps)
- [Notes](#notes)
- [Documents officiels (bulletins/PV)](#documents-officiels)
- [Annonces](#annonces)
- [Messagerie](#messagerie)
- [Notifications](#notifications)
- [Statistiques](#statistiques)
- [Intelligence Artificielle](#intelligence-artificielle)
- [Événements Socket.io](#événements-socketio)

---

## Authentification

| Méthode | Route | Rôle | Description |
|---|---|---|---|
| POST | `/auth/login` | Public | `{ email, motDePasse }` → `{ accessToken, user }` + cookie refresh. Verrouillage après 5 échecs (15 min). |
| POST | `/auth/refresh` | Cookie refresh | Émet un nouveau `accessToken` (rotation du refresh token). |
| POST | `/auth/logout` | Authentifié | Révoque le refresh token courant. |
| GET | `/auth/me` | Authentifié | Profil complet de l'utilisateur connecté. |
| POST | `/auth/forgot-password` | Public | `{ email }` → envoie un lien de réinitialisation (réponse neutre). |
| POST | `/auth/reset-password` | Public | `{ token, nouveauMotDePasse }`. |
| POST | `/auth/change-password` | Authentifié | `{ ancienMotDePasse, nouveauMotDePasse }`. |
| POST | `/auth/avatar` | Authentifié | Upload `multipart/form-data` champ `avatar` (image, 5 Mo max). |

## Administration

Réservé à `ADMIN_SCOLAIRE` / `SUPER_ADMIN`.

| Méthode | Route | Description |
|---|---|---|
| GET | `/admin/utilisateurs?role=&q=&page=&pageSize=` | Liste paginée, recherche par nom/prénom/email. |
| GET | `/admin/utilisateurs/:id` | Détail d'un utilisateur. |
| POST | `/admin/utilisateurs` | Crée un compte (étudiant/enseignant/admin), envoie les identifiants par email. |
| PUT | `/admin/utilisateurs/:id` | Met à jour (y compris `statutCompte`) - refuse de désactiver le dernier admin actif. |
| POST | `/admin/inscriptions` | `{ etudiantId, filiereId, anneeScolaire, niveau }`. |

## Structures académiques

Lecture : tout utilisateur authentifié. Écriture : `ADMIN_SCOLAIRE` / `SUPER_ADMIN`.

| Méthode | Route | Description |
|---|---|---|
| GET/POST/PUT/DELETE | `/structures/filieres[/:id]` | CRUD Filière. |
| GET/POST/PUT/DELETE | `/structures/modules[/:id]?filiereId=` | CRUD Module. |
| GET/POST/PUT/DELETE | `/structures/matieres[/:id]?moduleId=` | CRUD Matière. |
| GET/POST/PUT/DELETE | `/structures/salles[/:id]?type=` | CRUD Salle. |

## Cours

| Méthode | Route | Rôle | Description |
|---|---|---|---|
| GET | `/cours?matiereId=&moduleId=&page=&pageSize=` | Étudiant/Enseignant | Liste filtrée par filière (étudiant) ou matières affectées (enseignant). |
| GET | `/cours/:id/download` | Étudiant | URL Cloudinary signée, valable 15 min. |
| POST | `/cours/upload` | Enseignant | `multipart/form-data` : `fichier`, `matiereId`, `titre`, `remplacerDoublon`. Déclenche l'indexation RAG asynchrone. |

## Emploi du temps

| Méthode | Route | Rôle | Description |
|---|---|---|---|
| GET | `/edt?semestre=&anneeScolaire=&filiereId=` | Étudiant | `filiereId` optionnel : déduit de l'inscription active si omis. |
| GET | `/edt?moi=true` | Enseignant | Toutes les séances de l'enseignant connecté. |
| POST | `/edt` | Admin | `{ filiereId, semestre, anneeScolaire }` - crée l'EDT du semestre. |
| POST | `/edt/:emploiDuTempsId/seances` | Admin | Ajoute une séance (détection de conflit salle/enseignant, 409 avec créneaux alternatifs). |
| PUT | `/edt/seances/:seanceId` | Admin | Modifie une séance. |
| DELETE | `/edt/seances/:seanceId?confirm=true` | Admin | Supprime une séance. |

## Notes

| Méthode | Route | Rôle | Description |
|---|---|---|---|
| GET | `/notes/etudiant?semestre=&anneeScolaire=` | Étudiant | Notes validées, moyennes, rang dans la promotion. |
| GET | `/notes/bulletin?semestre=&anneeScolaire=` | Étudiant | Bulletin de semestre (si déjà généré). |
| GET | `/notes/etudiants?matiereId=` | Enseignant | Liste des étudiants inscrits, pour la grille de saisie. |
| POST | `/notes/saisir` | Enseignant | `{ matiereId, typeEvaluation, semestre, anneeScolaire, coefficientEvaluation, notes: [{etudiantId, valeur}] }`. |
| GET | `/notes/sessions-en-attente` | Admin | Sessions de notes non validées, groupées par matière. |
| PUT | `/notes/valider` | Admin | `{ matiereId, semestre, anneeScolaire }` → valide + notifie les étudiants. |
| PUT | `/notes/refuser` | Admin | `{ matiereId, semestre, anneeScolaire, commentaire }` → notifie l'enseignant. |

## Documents officiels

| Méthode | Route | Rôle | Description |
|---|---|---|---|
| POST | `/admin/bulletins/generer` | Admin | `{ filiereId, niveau, semestre, anneeScolaire }` → 202, traitement asynchrone (bulletins + PV). |

## Annonces

| Méthode | Route | Rôle | Description |
|---|---|---|---|
| GET | `/annonces?page=&pageSize=` | Tous | Filtrées par rôle/filière/module de l'utilisateur. |
| POST | `/annonces` | Enseignant/Admin | `{ titre, contenu, cible, filiereId?, moduleId?, etudiantCibleId? }`. Enseignant limité à son périmètre. |

## Messagerie

| Méthode | Route | Rôle | Description |
|---|---|---|---|
| GET | `/messages/canaux` | Étudiant | Canaux des modules où l'étudiant est inscrit. |
| GET | `/messages/canaux/:canalId/historique` | Étudiant | 100 derniers messages. |

> L'envoi de messages se fait exclusivement via **Socket.io** (voir plus bas), pas en REST.

## Notifications

| Méthode | Route | Description |
|---|---|---|
| GET | `/notifications?page=&pageSize=` | Liste paginée. |
| GET | `/notifications/non-lues/count` | Compteur pour la cloche de notification. |
| PUT | `/notifications/:id/lue` | Marque une notification comme lue. |
| PUT | `/notifications/lues/toutes` | Marque tout comme lu. |

## Statistiques

Réservé à `ADMIN_SCOLAIRE` / `SUPER_ADMIN` / `DIRECTION`.

| Méthode | Route | Description |
|---|---|---|
| GET | `/stats?filiereId=&semestre=&anneeScolaire=&format=json\|csv\|pdf` | Tableau de bord (taux de réussite, moyennes, activité IA). Export direct si `format=csv` ou `pdf`. |

## Intelligence Artificielle

Proxy interne vers le micro-service Python (jamais appelé directement par le frontend).

| Méthode | Route | Rôle | Description |
|---|---|---|---|
| POST | `/ia/chat` | Étudiant/Enseignant | `{ question }` → réponse RAG sourcée. Timeout 30s, mode dégradé si LLM indisponible. |
| POST | `/ia/search` | Étudiant | `{ requete }` (≥3 caractères) → passages pertinents, repli plein texte si IA indisponible. |
| POST | `/ia/fiche` | Étudiant | `{ type, matiereId?, moduleId?, coursDocumentId? }` → 202, génération asynchrone. |
| GET | `/ia/fiche/:id` | Étudiant | Statut/contenu de la fiche. |
| GET | `/ia/fiche/:id/pdf` | Étudiant | Génère (si besoin) et renvoie l'URL du PDF exporté. |

## Événements Socket.io

Connexion : `io(BACKEND_URL, { auth: { token: accessToken } })`.

| Événement | Sens | Payload | Description |
|---|---|---|---|
| `canal:join` | client → serveur | `canalId` | Rejoint la room d'un canal de messagerie. |
| `canal:leave` | client → serveur | `canalId` | Quitte la room. |
| `canal:typing` | client → serveur | `{ canalId, prenom }` | Signale une frappe en cours, relayé aux autres membres du canal. |
| `canal:typing` | serveur → client | `{ userId, prenom }` | Un autre membre du canal est en train d'écrire. |
| `canal:presence` | serveur → client | `{ canalId, count }` | Nombre de connexions actuellement présentes dans le canal (approximation pour l'accusé "✓✓"). |
| `message:send` | client → serveur | `{ canalId, contenu }` (ack) | Envoie un message (étudiant uniquement). |
| `message:signaler` | client → serveur | `{ canalId, messageId }` (ack) | Signale un message. |
| `message:new` | serveur → client | `Message` | Nouveau message dans un canal rejoint. |
| `message:flagged` | serveur → client | `{ messageId }` | Un message a été signalé. |
| `notification:new` | serveur → client | `Notification` | Nouvelle notification pour l'utilisateur connecté. |
| `notes:validated` | serveur → client | `{ matiereId }` | Les notes de l'étudiant ont été validées. |
| `edt:updated` | serveur → client | `{ emploiDuTempsId, action }` | L'EDT de la filière a changé. |
| `cours:new` | serveur → client | `{ coursDocumentId, titre }` | Nouveau cours déposé dans la filière. |
