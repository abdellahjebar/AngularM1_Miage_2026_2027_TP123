# TP1 — Mission 0 : cartographie de l'application

## 1. Éléments retrouvés (frontend)

| Élément | Fichier : ligne | Rôle (une phrase) |
|---|---|---|
| Composant racine | `src/main.ts:8` (démarrage), `components/app/app.ts:4-10` (`AppComponent`, sélecteur `app-root`) | Point d'entrée de l'application : `bootstrapApplication(AppComponent, ...)` la lance, et son template `app.html` contient la navigation et le `<router-outlet />` (`app.html:14`) où s'affichent les pages. |
| Configuration des routes | `src/app/routes.ts:8-15`, activée par `provideRouter(routes)` dans `main.ts:10` | Associe chaque chemin à une page : `login` et `register` sont publiques, `profile` et `tracks` sont protégées par `authGuard` (`routes.ts:12-13`), `''` et `**` redirigent vers `tracks`. |
| Enregistrement de `HttpClient` | `src/main.ts:11` : `provideHttpClient(withInterceptors([authInterceptor]))` | Rend `HttpClient` injectable dans toute l'application et branche l'intercepteur sur **toutes** les requêtes HTTP. |
| Mécanisme qui ajoute le JWT | `shared/interceptors/auth.interceptor.ts:6-16`, enregistré en `main.ts:11` ; le jeton vient de `auth.service.ts:13` | L'intercepteur lit le Signal `token()` et, s'il existe, clone la requête avec l'en-tête `Authorization: Bearer <jeton>`. |

### Modèles, services et pages

| Fichier | Rôle |
|---|---|
| `shared/models/user.model.ts` | Interface `User` : `id`, `name`, `email`, `createdAt` (forme publique renvoyée par l'API). |
| `shared/models/auth-response.model.ts` | Interface `AuthResponse` : `{ token, user }`, réponse de `login` et `register`. |
| `shared/models/track.model.ts` | Interface `Track` : métadonnées d'une piste audio (titre, nom d'origine, type MIME, taille). |
| `shared/models/page.model.ts` | Interface générique `Page<T>` : `items`, `page`, `limit`, `total`, `pages` (réponse paginée de `/tracks`). |
| `shared/services/auth.service.ts` | Service d'authentification : `login`, `register`, `profile`, `update`, `logout` ; porte l'état dans les Signals `currentUser` (l.12) et `token` (l.13, initialisé depuis `localStorage`) ; `storeAuthentication` (l.45-49) enregistre le jeton. |
| `shared/services/track.service.ts` | Appels HTTP des pistes : `list(page, limit)` (l.11), `upload(file, title)` en `FormData` (l.17), `audio(id)` en `Blob` (l.24). |
| `shared/interceptors/auth.interceptor.ts` | Ajoute l'en-tête `Authorization` aux requêtes sortantes. |
| `shared/guards/auth.guard.ts` | `authGuard` : laisse passer si `token()` existe, sinon redirige vers `/login` (l.10). |
| `components/app/` | Page racine : en-tête, navigation, `<router-outlet />`. |
| `components/login-page/` | Formulaire de connexion (Reactive Forms) ; `submit()` appelle `AuthService.login` puis redirige vers `/tracks`. |
| `components/register-page/` | Formulaire d'inscription ; appelle `AuthService.register` puis redirige vers `/profile`. |
| `components/profile-page/` | Affiche le profil (`/users/me`) et permet de modifier le nom. |
| `components/tracks-page/` | Bibliothèque : liste paginée, import d'un fichier audio, lecture. |
| `proxy.conf.json` | En développement, redirige `/api` (port 4200) vers `http://localhost:3000`. |

## 2. Routes publiques et protégées (`API_CONTRACT.md`)

Une route est protégée lorsque le middleware `auth` figure dans sa définition dans `backend/src/app.js`.

| Méthode | Route | Publique / Protégée | Vérifié dans `app.js` (ligne) |
|---|---|---|---|
| GET | `/health` | Publique | l.153, pas de `auth` |
| POST | `/auth/register` | Publique | l.164, pas de `auth` |
| POST | `/auth/login` | Publique | l.195, pas de `auth` |
| GET | `/users/me` | Protégée | l.229, `auth` |
| PUT | `/users/me` | Protégée | l.249, `auth` |
| GET | `/tracks` | Protégée | l.271, `auth` |
| POST | `/tracks` | Protégée | l.334-337, `auth` puis `upload.single("audio")` |
| GET | `/tracks/:id/audio` | Protégée | l.379, `auth` |
| DELETE | `/tracks/:id` | Protégée | l.409, `auth` |

### Le contrat et le code sont-ils cohérents ?

Presque. La phrase d'introduction du contrat dit : « Sauf inscription et connexion, envoyer `Authorization: Bearer <token>` ». Le code suit cette règle pour toutes les routes métier, mais `/health` est lui aussi public (`app.js:153`), alors que la phrase ne cite que l'inscription et la connexion. Le tableau, lui, liste bien `/health` sans jeton (`-`), donc le contrat est cohérent avec le code si l'on lit le tableau, et légèrement incomplet si l'on ne lit que la phrase.

Deux précisions vérifiées côté code :
- le middleware `auth` (`app.js:56-77`) répond `401` avec le message « Authentification requise » quand l'en-tête est absent, et `401` « Jeton invalide ou expiré » quand la signature ou la date est invalide ;
- l'accès à `/tracks` est filtré par propriétaire (`ownerId: req.auth.sub`, `app.js:275`) : le jeton ne donne pas accès aux pistes des autres utilisateurs.
