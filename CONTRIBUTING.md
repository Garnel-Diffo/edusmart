# Guide de contribution — EduSmart

Ce document explique comment contribuer au dépôt EduSmart : workflow Git, conventions,
et fiches de tâches détaillées pour les membres de l'équipe.

## Sommaire

- [Équipe & répartition](#équipe--répartition)
- [Workflow Git](#workflow-git)
- [Convention de commits](#convention-de-commits)
- [Processus de Pull Request](#processus-de-pull-request)
- [Fiche de tâche — Paul Loïc MBIDA (Annonces)](#fiche-de-tâche--paul-loïc-mbida-annonces)
- [Fiche de tâche — Wilfried MEZAGO (Messagerie)](#fiche-de-tâche--wilfried-mezago-messagerie)
- [Checklist avant de demander une revue](#checklist-avant-de-demander-une-revue)

---

## Équipe & répartition

| Membre | Rôle | Périmètre |
|---|---|---|
| **Garnel DIFFO KENNE** | Chef de projet, Fullstack | Backend Node/Express complet, service IA Python/FastAPI, majorité du frontend Next.js, DevOps/déploiement |
| **Paul Loïc MBIDA** | Contributeur Frontend | Feature **Annonces** (UC17/UC18) — voir fiche détaillée ci-dessous |
| **Wilfried MEZAGO** | Contributeur Frontend | Feature **Messagerie** (UC19) — voir fiche détaillée ci-dessous |

Le backend, le service IA et l'API ne sont **pas** à modifier par les contributeurs sans
concertation : ils sont stables et documentés dans [backend/docs/API.md](backend/docs/API.md). Si un
besoin d'évolution apparaît (nouveau champ, nouvelle route), ouvrez une issue plutôt que
de modifier `backend/` ou `ai-service/` directement.

## Workflow Git

Le dépôt utilise un modèle **Git Flow simplifié** à deux branches longues :

- `main` — code de production, déployé automatiquement (Render + Vercel). **Protégée**,
  jamais de push direct.
- `develop` — branche d'intégration. **Protégée**, jamais de push direct.

Chaque tâche se fait sur une branche dédiée, créée depuis `develop` :

```bash
git checkout develop
git pull origin develop          # toujours repartir d'une base à jour
git checkout -b feature/paul-loic/annonces-publication
```

Convention de nommage : `feature/<prenom>/<sujet-court>` (ex. `feature/wilfried/messagerie-signalement`),
`fix/<prenom>/<sujet>` pour un correctif.

### Règles essentielles (à respecter scrupuleusement)

1. **Ne jamais travailler directement sur `main` ou `develop`.**
2. **`git pull origin develop` avant de commencer à travailler chaque jour**, pour
   repartir d'une base à jour et limiter les conflits de fusion.
3. **Avant de pousser**, remettre sa branche à jour par rapport à `develop` :
   ```bash
   git checkout develop && git pull origin develop
   git checkout feature/votre-branche
   git merge develop        # ou : git rebase develop (si vous êtes à l'aise avec le rebase)
   ```
   Résolvez les conflits localement, jamais en forçant un push.
4. **Commits petits et fréquents**, avec des messages clairs (voir convention ci-dessous).
5. **Jamais de `git push --force` sur `develop` ou `main`.**
6. **Une Pull Request par fonctionnalité**, pas un gros PR fourre-tout.
7. Ne committez **jamais** de fichier `.env` (ils sont dans `.gitignore` — vérifiez avant
   chaque commit avec `git status`).

## Convention de commits

Format inspiré de [Conventional Commits](https://www.conventionalcommits.org/) :

```
<type>(<portée>): <description courte à l'impératif>
```

Types : `feat` (nouvelle fonctionnalité), `fix` (correctif), `style` (UI/CSS sans
logique), `refactor`, `docs`, `test`, `chore` (config, dépendances).

Exemples :
```
feat(annonces): ajoute le filtre par cible dans la liste
fix(messagerie): corrige le scroll automatique sur nouveau message
style(annonces): améliore l'espacement des cartes sur mobile
```

## Processus de Pull Request

1. Poussez votre branche : `git push origin feature/votre-branche`.
2. Ouvrez une PR **vers `develop`** (jamais directement vers `main`).
3. Remplissez la description : quoi, pourquoi, comment tester, captures d'écran pour
   tout changement visuel (obligatoire pour le frontend).
4. Le chef de projet relit et fusionne (squash merge) après validation.
5. Une fois `develop` stabilisée et testée, elle est fusionnée dans `main` par le chef
   de projet pour déclencher le déploiement.

---

## Fiche de tâche — Paul Loïc MBIDA (Annonces)

**Cas d'utilisation couverts** : UC17 (Consulter les annonces), UC18 (Publier une
annonce). **Branche de départ** : `feature/paul-loic/annonces`.

### Ce qui existe déjà (ne pas retoucher)

- API backend complète et stable : `GET/POST /api/annonces` (voir [backend/docs/API.md](backend/docs/API.md#annonces)).
- Client API déjà câblé : `annoncesApi` dans `frontend/src/lib/api.ts`.
- Types TypeScript : `Annonce` dans `frontend/src/types/index.ts`.
- Une **version de base fonctionnelle** existe déjà :
  - `frontend/src/app/etudiant/annonces/page.tsx` (liste + détail expand/collapse)
  - `frontend/src/app/enseignant/annonces/page.tsx` (liste + formulaire de publication, ciblage MODULE uniquement)
  - `frontend/src/app/admin/annonces/page.tsx` (liste + formulaire complet TOUS/FILIERE/MODULE)

### Ce qu'il faut construire / améliorer

1. **Filtres de consultation** (page étudiant) : ajouter des filtres par cible et par
   date (cette semaine / ce mois / tout), avec un composant `Select` (déjà dans
   `components/ui/select.tsx`).
2. **Recherche texte** dans le titre/contenu des annonces (champ de recherche au-dessus
   de la liste, filtrage côté client suffit pour ce volume de données).
3. **Pagination "Charger plus"** au lieu de charger 30 annonces d'un coup (le endpoint
   accepte déjà `page`/`pageSize`).
4. **Page de détail dédiée** (`/etudiant/annonces/[id]`) au lieu du simple expand/collapse
   actuel, avec une mise en page plus riche (auteur avec avatar, badges de cible plus
   lisibles, bouton retour).
5. **Design** : harmoniser les 3 pages (étudiant/enseignant/admin) pour qu'elles
   partagent un composant `AnnonceCard` commun (`components/annonces/annonce-card.tsx`
   à créer) plutôt que de dupliquer le JSX de la carte trois fois.
6. **Animations** : transitions d'entrée en cascade plus travaillées avec Framer Motion
   (déjà utilisé partout dans le projet, voir `components/shared/stat-card.tsx` pour
   l'exemple de pattern `initial`/`animate`/`transition delay`).

### Critères d'acceptation

- [ ] Un composant `AnnonceCard` réutilisé sur les 3 pages.
- [ ] Filtres fonctionnels (cible, période) côté étudiant.
- [ ] Recherche texte fonctionnelle.
- [ ] Pagination "Charger plus" qui fonctionne sans recharger toute la liste.
- [ ] Aucune régression sur la publication (enseignant/admin).
- [ ] Testé sur mobile (375px) et desktop — captures d'écran dans la PR.
- [ ] `npm run lint` et `npm run build` passent sans erreur dans `frontend/`.

---

## Fiche de tâche — Wilfried MEZAGO (Messagerie)

**Cas d'utilisation couvert** : UC19 (Chat entre étudiants). **Branche de départ** :
`feature/wilfried/messagerie`.

### Ce qui existe déjà (ne pas retoucher)

- Serveur Socket.io complet côté backend (rooms, événements, modération) — voir
  [backend/docs/API.md](backend/docs/API.md#événements-socketio) pour le contrat exact des événements.
- Client Socket.io déjà initialisé après login : `frontend/src/lib/socket.ts`,
  `getSocket()` exporté pour récupérer l'instance connectée.
- API REST pour l'historique : `messagerieApi.canaux()` / `messagerieApi.historique(canalId)`.
- Une **version de base fonctionnelle** existe déjà dans
  `frontend/src/app/etudiant/messagerie/page.tsx` : liste des canaux, affichage des
  messages, envoi, signalement basique.

### Ce qu'il faut construire / améliorer

1. **Indicateur "en train d'écrire..."** : émettre un événement custom (à définir,
   ex. `canal:typing`) quand l'utilisateur tape, et l'afficher pour les autres
   participants. ⚠️ Si vous ajoutez un nouvel événement Socket.io, il doit être géré
   côté serveur (`backend/src/modules/messagerie/messagerie.socket.ts`) — coordonnez-vous
   avec le chef de projet avant de l'utiliser côté client.
2. **Accusés de réception/lu** : indicateur visuel simple (✓ / ✓✓) sur les messages
   envoyés par l'utilisateur courant.
3. **Amélioration du signalement** : remplacer l'icône discrète actuelle par une
   confirmation claire (`Dialog` de `components/ui/dialog.tsx`) avant de signaler.
4. **Recherche de canal** dans la liste, si le nombre de modules est important.
5. **Gestion du scroll** : actuellement le scroll automatique se fait à chaque nouveau
   message ; il faut détecter si l'utilisateur a remonté manuellement dans l'historique
   et, dans ce cas, ne pas forcer le scroll (afficher plutôt un bouton "Nouveaux
   messages ↓").
6. **Reconnexion** : tester le comportement quand la connexion Socket.io est coupée puis
   rétablie (mode avion sur mobile, par exemple) — le canal actif doit être rejoint
   automatiquement à la reconnexion (`socket.on('connect', ...)`).
7. **Design** : look plus proche d'une app de messagerie moderne (bulles mieux
   différenciées, avatars, horodatage groupé par tranche de temps plutôt que sur chaque
   message).

### Critères d'acceptation

- [ ] Indicateur de saisie fonctionnel (a minima visuellement, même en mock si la partie
      serveur n'a pas encore été coordonnée).
- [ ] Confirmation avant signalement.
- [ ] Scroll intelligent (pas de saut forcé si l'utilisateur lit l'historique).
- [ ] Reconnexion testée manuellement (couper le Wi-Fi puis le rétablir).
- [ ] Testé sur mobile (375px) et desktop — captures d'écran dans la PR.
- [ ] `npm run lint` et `npm run build` passent sans erreur dans `frontend/`.

---

## Checklist avant de demander une revue

- [ ] `git pull origin develop` puis fusion dans ma branche, sans conflit restant.
- [ ] `npm run lint` sans erreur.
- [ ] `npm run build` sans erreur.
- [ ] Testé manuellement en local (`npm run dev` dans `frontend/`, backend +
      service IA déjà lancés — voir [README.md](README.md#installation-locale)).
- [ ] Testé en responsive (mobile + desktop).
- [ ] Pas de fichier `.env` ni de secret dans le diff (`git status` propre).
- [ ] Description de PR complète avec captures d'écran si changement visuel.
