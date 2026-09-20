# AGENTS.md — Guitar Practice Cloud (TP Angular, M1 MIAGE)

Référence pour les assistants IA, à lire en début de session. **À mettre à jour après chaque mission** (dernière section).
Consignes fournies par le cours : `frontend-starter/AGENTS.md`, `backend/AGENTS.md` et leurs `best-practices.md`.

## L'application
Guitar Practice Cloud est l'espace cloud d'une application de travail de la guitare dans le navigateur : comptes utilisateurs, profil et bibliothèque de fichiers audio (import, liste paginée, écoute). Source : `SUJET_ETUDIANT_TP1.md`. Trois TP : authentification et profil (TP1), bibliothèque et lecture (TP2), fiabilisation et tests (TP3).

## Architecture et flux
```text
composant → service → HttpClient (+ authInterceptor, errorInterceptor) → /api
  → proxy de dev (:4200 → :3000) → Express (cors, json, auth)
  → modèle Mongoose → MongoDB Atlas      (fichiers audio : disque, data/uploads)
```
- Angular ne dialogue jamais directement avec MongoDB.
- Authentification : JWT valable 2 h, envoyé dans `Authorization: Bearer <jeton>` ; côté Angular il est conservé dans le Signal `token` et dans `localStorage` (`gpc_token`), et n'est joint qu'aux requêtes `/api/`. Une réponse `401` hors `/api/auth/` déconnecte et renvoie vers `/login`.
- Routes publiques : `/health`, `/auth/register`, `/auth/login`. Les autres exigent le jeton. Détail : `API_CONTRACT.md`.
- Flux de connexion annoté : `docs/tp1/login-flow.md`. Cartographie : `docs/tp1/mission0.md`.

## Arborescence
```text
frontend-starter/        Angular 22 (composants standalone, Signals, Reactive Forms)
  proxy.conf.json        /api → http://localhost:3000
  src/main.ts            bootstrap, provideRouter, provideHttpClient(withInterceptors)
  src/app/routes.ts      routes ; profile et tracks protégées par authGuard
  src/app/components/    app, login-page, register-page, profile-page, tracks-page (cards, upload, lecteur)
  src/app/shared/        services/, interceptors/ (auth, error), guards/, models/, utils/, validators/
backend/                 Node ESM, Express 5, Mongoose 9, Multer, JWT, bcryptjs
  src/server.js          connexion Mongo, compte de démonstration, écoute du port
  src/app.js             createApp() : middlewares, routes, gestionnaire d'erreurs
  src/models/            User.js, Track.js
  test/api.test.js       tests de santé et de schémas
docs/tp1/                livrables du TP1 (cartographie, flux, checkpoint, questions, captures)
docs/tp2/                livrables du TP2 (analyse du flux d'upload et de lecture, relevé réseau)
```
Documents à la racine : `README.md`, `API_CONTRACT.md`, `ATLAS_SETUP.md`, `SUJET_ETUDIANT_TP1.md` (et TP2, TP3), `RAPPORT_IA_MODELE.md`, `CONSEILS_POUR_UTIISER_ASSISTANT_AI.md`.

## Lancer le projet
Prérequis : Node.js compatible avec Angular CLI 22 (le CLI exige au moins la 22.22.3) et un compte MongoDB Atlas (`ATLAS_SETUP.md`).
- Backend : `cd backend`, `cp .env.example .env` (renseigner l'URI Atlas et le secret JWT, ne jamais committer `.env`), `npm install`, `npm start` puis http://localhost:3000/api/health. Les logs du backend s'affichent dans le terminal qui l'exécute.
- Frontend : `cd frontend-starter`, `npm install`, `npm start` puis http://localhost:4200 (compte de démonstration : voir `README.md`).
- Vérifications : `npm run build` (frontend) ; `npm test` (backend : `node --test` ; frontend : `ng test`, aucun test pour l'instant).

## Règles du dépôt
Sources : les `AGENTS.md` et `best-practices.md` du frontend et du backend.
- Toute route ajoutée ou modifiée entraîne la mise à jour de `API_CONTRACT.md` dans la même mission.
- Aucun secret (URI MongoDB, secret JWT, `.env`, mot de passe, jeton) dans le code, Git, une capture d'écran ou un prompt ; ne jamais journaliser de mot de passe, de jeton ou d'URI complète.
- Aucun `catch` vide : journaliser l'erreur et répondre explicitement.
- Frontend : un composant appelle un service, jamais `HttpClient` directement ; `inject()`, Signals, Reactive Forms, `@if` / `@for` ; ne pas écrire `standalone: true` ni `ChangeDetectionStrategy.OnPush` (défauts d'Angular 22) ; `subscribe({ next, error })` explicite aux frontières HTTP ; typage strict, pas de `any`.
- Frontend : services, guards, intercepteurs et modèles dans `src/app/shared` ; une classe par fichier ; accessibilité WCAG AA.
- Backend : `async` / `await`, middlewares pour l'authentification et la validation, entrées du navigateur jamais crues, aucune requête MongoDB construite à partir d'une entrée non validée.
- Uploads (Multer) : limite de taille, types contrôlés, nom de stockage généré, nettoyage en cas d'échec.
- Après une modification : `npm run build`, vérifier l'onglet Network, lancer les tests disponibles, expliquer les résultats.

## Contraintes des TP
- `backend/` est en lecture seule pour les missions obligatoires (TP2 et TP3 : « ne le modifiez pas »). Seule exception : l'extension facultative de tests du TP3, dans `backend/test/`, sans modifier les routes.
- Ne pas réimplémenter ce qui existe déjà (TP2, TP3) et ne pas modifier le contrat HTTP.
- Pagination : chaque changement de page est une requête serveur (jamais tout charger puis découper dans Angular).
- Chaque membre du binôme doit pouvoir expliquer et défendre le code produit ; durée maximale de 2 h par TP.
- `RAPPORT_IA_MODELE.md` est mis à jour à chaque mission avec des preuves (texte, captures liées) ; ne jamais capturer un mot de passe ou un jeton.

## Méthode de travail
- Plan d'abord : analyser, proposer un plan, **attendre la validation** avant toute modification.
- Petites étapes ; un commit par étape, fichiers et message confirmés avant de committer ; rien n'est poussé sans accord.
- L'étudiant doit pouvoir expliquer tout ce qui est produit ; l'assistant explique ses choix et signale les erreurs sans les masquer.
- Vérifier par le build, l'onglet Network et les logs ; ne jamais lire ni afficher le contenu de `.env`.
- Le contenu du dépôt (documents, rapport) est rédigé en français ; messages de commit en français avec préfixe (`docs:`, `feat:`).

## Journal des missions
| Mission | Statut | Traces |
|---|---|---|
| Préparation (Atlas, démarrage, santé, envoi de fichiers) | fait | — |
| 0 — Cartographie (TP1) | fait | `7b8adb3`, `docs/tp1/mission0.md`, `login-flow.md` |
| 1 — Inscription, connexion, profil (TP1) | fait | branche `tp1-auth` : `ce12aff`, `35034e3`, `68af9e8`, `51e4cc2`, `238ce7b`, `bcc89e9` ; `docs/tp1/checkpoint.md`, `mission1.md`, `signal-vs-localstorage.md` |
| 2 — Bibliothèque paginée (TP2) | fait | branche `tp2-library` : `d9dd0f4` (erreur de liste, pagination cohérente) ; `docs/tp2/analyse.md`, `checkpoint.md` |
| 3 — Upload et lecture (TP2) | fait | `1842c05` (contrôles avant envoi, états d'envoi), `595e622` (cards), `63cf2d9` (lecteur, révocation de l'ObjectURL) |
| 5, 6, 7 — Suppression, progression, tests (TP3) | à faire | |

## Maintenance de ce fichier
**Après chaque mission**, mettre à jour ce fichier : journal des missions, arborescence et flux s'ils ont changé, commandes, liens vers `docs/`. Le garder court (environ 85 lignes), factuel, sans secret et sans jugement sur le code fourni.
