# Rapport d'usage de l'IA - TP1

*Ce rapport couvre le TP1 (Missions 0 et 1) et le TP2 (bibliothèque, upload et lecture audio).*

Pour chaque mission, détailler et fournir des explications concernant : objectif; prompt principal; plan proposé par l'agent; vérifications réalisées par le binôme; erreurs ou propositions rejetées; fichiers effectivement modifiés; preuve de fonctionnement; ce que chaque membre sait maintenant expliquer sans l'agent.

## Outil utilisé

- Assistant : Claude Code, extension VS Code (agent de projet : lit les fichiers du dépôt et lance des commandes dans le terminal).
- Modèle : Claude Sonnet 5.
- Consommation de tokens : non relevée ; elle se consulte dans l'outil (indicateur de contexte, page d'utilisation du compte).
- Travail réalisé seul pour l'instant (pas encore de binôme).

## Synthèse

*Plan du document : outil utilisé · synthèse · consignes de méthode · Mission 0 · Mission 1 (étapes 1 à 4 et clôture) · TP2 (étapes 1 à 6).*

**Périmètre.** TP1 : cartographie de l'application (Mission 0), puis Mission 1 (validation des formulaires, déconnexion, retour vers `/login` sur un `401`, jeton limité aux requêtes `/api`, profil). TP2 : analyse du flux d'upload et de lecture, pagination robuste, upload sécurisé, cards accessibles, lecture audio complète et relevé réseau.

**Méthode appliquée à chaque étape.** Plan proposé par l'assistant et validé avant toute écriture ; code ; build ; test dans un navigateur réel (Edge sans interface, scripts conservés hors du dépôt) ; contrôle visuel ; entrée dans ce rapport ; un commit par étape. Le backend n'est jamais modifié et aucun secret n'est versionné (contrôle sur tout l'historique avant la publication de la branche du TP1).

**Preuves.** 152 vérifications automatisées au total (81 pour le TP1, 71 pour le TP2), toutes réussies sur le code final. Pour cinq étapes (jeton limité à `/api`, pagination, upload, cards, lecture), le test a d'abord été exécuté contre l'ancien code afin de vérifier qu'il échoue : il détecte donc bien ce qu'il prétend contrôler.

**Points de robustesse mis en évidence puis traités.**
- un double clic envoyait deux fois le même fichier ;
- des réponses tardives créaient des URL d'objet et la dernière n'était jamais révoquée en quittant la page (5 créées pour 4 révoquées) ;
- le jeton était joint à n'importe quelle URL, y compris d'une autre origine ;
- après l'échec d'un changement de page, l'indicateur de page et la liste n'étaient plus cohérents ;
- « Aucune piste. » s'affichait à côté d'un message d'erreur.

**Rôles.** L'assistant a proposé les plans, écrit le code et les tests, puis présenté leurs résultats. J'ai fixé les exigences (qualité de production, dépôt en français, aucun secret, plan validé avant écriture, un commit par étape), tranché les compromis (par exemple ce qui reste hors périmètre) et contrôlé à la main l'étape 1 et le relevé réseau du TP1. Chaque erreur de l'assistant repérée en cours de route est consignée dans « Erreurs ou propositions rejetées ».

## Consignes de méthode que j'ai données à l'assistant

Extraits d'origine, en anglais et non corrigés. Ils montrent la démarche que j'ai imposée : comprendre avant de coder, planifier avant d'agir, viser la qualité de production, ne rien affirmer que je n'aie vérifié.

| Thème | Extrait |
|---|---|
| Rôle et ambition | « youll be my tutor and school assissor youll guide me to become the best engineer i can » ; « i wanna become the best i could continuously » |
| Le sujet est un socle, pas un plafond | « its not a sacred given thing we can always go beyond that staying up to date with best practices » |
| Planifier avant d'agir | « its better to discuss and plan before we go on and keep the agile loop going on » |
| Comprendre avant de coder | « lets first fork read and understand everything before we continue » ; « i wanna have the full context » |
| Apprendre une base de code | « whats the practice to understand the whole code base and workflow and architecture and everything ? » |
| Qualité des prompts | « i think these are better but we need to actually do that » (à propos des prompts structurés 1 à 3, que j'ai ensuite envoyés réellement) |
| Qualité de production | « production grade » (exigence posée pour tout ce qui est attendu par le sujet) |
| Honnêteté du rapport | « i dont wanna lie so give me the prompts » |

Autres consignes données : tout le contenu du dépôt est rédigé en français, un commit par étape avec les fichiers indiqués par leur nom, et rien n'est publié sans mon accord.

## Mission 0 — Cartographier l'application

**Objectif.** Comprendre l'architecture de l'application sans modifier le code : retrouver le composant racine, la configuration des routes, l'enregistrement de `HttpClient`, les modèles, services et pages, et le mécanisme qui ajoute le JWT. Produire un schéma annoté du flux d'un clic sur « Se connecter » et distinguer les routes publiques des routes protégées.

**Prompts, dans l'ordre réel.**

*Phase 1 — lecture du dépôt et cartographie (messages courts, en anglais).* Après la lecture des documents du dépôt (« go on explain to me everything », « show me the complete architecture », « draw the architecture of the code base »), j'ai collé le texte de la Mission 0 avec la question « what to do here », puis demandé où placer les réponses (« where should i put the answer ») et de les rédiger (« put the answers »). Les réponses ont été écrites dans `docs/tp1/`.

*Phase 2 — prompts structurés (synthèse et fichier de référence), envoyés ensuite.* Rédigés d'après le modèle du guide du cours (§5 et §6) :

> **Prompt 1.** You are my development assistant for this project: an Angular 22 frontend in frontend-starter/ and an Express/Mongoose backend in backend/.
>
> First read README.md and API_CONTRACT.md. Then analyze each part separately, without modifying any file:
> 1. frontend-starter/: its AGENTS.md and best-practices.md, then the code under src/.
> 2. backend/: its AGENTS.md and best-practices.md, then src/ and test/.
>
> For each part give me: its role, tech stack, entry point, an annotated folder tree, the key files and what each is responsible for, the data flow, and the rules I must follow. Cite file:line, and verify every line reference in the code before citing it. Never read or display .env, secrets or tokens.
>
> End with the points where the two parts connect (the API contract) and a list of anything you could not verify. Answer in English.

> **Prompt 2.** Based on that analysis, read all the files concerned by Mission 0 of TP1 (SUJET_ETUDIANT_TP1.md, main.ts, routes.ts, shared/, components/, app.js, the models).
>
> Do not modify anything yet. First propose a plan for an AGENTS.md at the repo root, plus a CLAUDE.md that points to it, meant as your reference for future sessions. It should cover: what the application is for, architecture and data flow, folder layout, how to run it, the rules from the repo's own guidance files, the TP constraints (backend is read-only), our working rule (plan first, wait for my approval before any change), and a per-mission progress log.
>
> Requirements: factual and neutral, no secrets, no judgment about the provided code, short (around 80 lines, linking to docs/ instead of copying), written in French. It must include the rule "update this file after every mission". Wait for my approval before writing anything.

> **Prompt 3.** Save to your memory that the AGENTS.md at the repo root must be updated after every mission (mission log, plus any change to the architecture or rules), and note where that file lives.

**Analyse des prompts.** Ceux de la phase 1 étaient courts, sans contrainte explicite ni critère de réussite, et s'appuyaient sur le contexte de la lecture précédente. Ceux de la phase 2 suivent le modèle du guide : objectif, fichiers à lire, ce qui est interdit (modification, secrets), format de sortie, vérification des références de lignes, liste de ce qui n'a pas pu être vérifié, et validation obligatoire avant toute écriture.

**Fichiers consultés par l'assistant.** README, `API_CONTRACT.md`, `SUJET_ETUDIANT_TP1/2/3.md`, `CONSEILS_POUR_UTIISER_ASSISTANT_AI.md`, `ATLAS_SETUP.md`, `AGENTS.md` et `best-practices.md` (backend et frontend), `backend/src/app.js`, `server.js`, `models/User.js`, `models/Track.js`, `backend/test/api.test.js`, `frontend-starter/src/main.ts`, `routes.ts`, les services, l'intercepteur, le guard, les modèles, les cinq composants, `proxy.conf.json`, `package.json`, `angular.json`. Jamais le fichier `.env`.

**Plan proposé par l'agent.**
- Mission 0 :
  1. Retrouver les cinq éléments du frontend avec une recherche dans les fichiers (`bootstrapApplication`, `provideRouter`, `provideHttpClient`, `Authorization`).
  2. Étiqueter chaque route du contrat comme publique ou protégée, puis vérifier dans `app.js` la présence du middleware `auth`.
  3. Dessiner le flux de connexion en étapes numérotées avec fichier et ligne, côtés Angular et Express.
- `AGENTS.md` (proposé avant écriture, dix sections, environ 85 lignes) : objet du fichier, application, architecture et flux, arborescence, lancement, règles du dépôt, contraintes des TP, méthode de travail, journal des missions, maintenance. `CLAUDE.md` de cinq lignes qui renvoie vers `AGENTS.md`.

**Vérifications réalisées.**
- Références de lignes vérifiées par recherche dans les fichiers et par lecture numérotée, côtés backend et frontend, avant d'être citées.
- Environnement lancé pour observer le comportement réel : backend connecté à MongoDB Atlas (`/api/health` répond `200`, compte de démonstration présent), frontend sur le port 4200.
- Onglet Network des DevTools : connexion réussie (`200`, corps `{token, user}`) et connexion refusée avec un mauvais mot de passe (`401`, message « Identifiants incorrects »).
- Plan de `AGENTS.md` relu puis validé avant l'écriture. Après écriture : 79 lignes, aucune chaîne de type secret ou identifiant, les 24 chemins référencés existent. Relecture du diff avant le commit.

**Erreurs ou propositions rejetées.**
- L'assistant avait affirmé que l'intercepteur n'agit pas sur la requête de connexion, faute de jeton. Les DevTools ont montré un en-tête `Authorization` sur cette requête : un jeton était déjà enregistré, et l'intercepteur n'a aucun filtre sur l'URL. Explication corrigée dans le schéma.
- L'assistant avait d'abord estimé que la partie authentification du TP1 était déjà entièrement réalisée par le code fourni. La relecture de la Mission 1 a montré des éléments à faire : messages de validation, bouton de déconnexion, gestion du `401`.
- L'assistant avait proposé de reformuler après coup un prompt dans le rapport. J'ai refusé : le rapport ne cite que les prompts réellement envoyés, et j'ai envoyé les prompts structurés ci-dessus.
- Problèmes d'environnement rencontrés : la version de Node (22.14.0) était trop ancienne pour Angular CLI (minimum 22.22.3), mise à jour en 22.23.2 ; la résolution DNS des enregistrements SRV était refusée sur ce réseau, la connexion MongoDB utilise donc la forme standard `mongodb://` dans mon `.env` local (non versionné).

**Fichiers effectivement modifiés.** Créés : `docs/tp1/mission0.md` et `docs/tp1/login-flow.md`, puis `AGENTS.md` et `CLAUDE.md` à la racine. Aucun fichier de code modifié. Le fichier `backend/.env` a été créé en local et n'est pas versionné. Hors dépôt : la règle « mettre à jour `AGENTS.md` après chaque mission » a été enregistrée dans la mémoire de l'assistant.

**Preuve de fonctionnement.** Commit `7b8adb3` (cartographie et schéma du flux) et commit `831e597` (`AGENTS.md` et `CLAUDE.md`). Capture de la requête de connexion dans les DevTools (un jeton était déjà enregistré : l'en-tête `Authorization` est présent, sa valeur est masquée) :
  ![Requête de connexion, statut 200](docs/tp1/img/login-200.png)

**Ce que je sais maintenant expliquer sans l'agent.** *(à confirmer après un auto-test à voix haute)*
- Le trajet complet d'un clic sur « Se connecter » : composant, `AuthService`, intercepteur, proxy, Express, modèle, MongoDB, puis retour, stockage du jeton et redirection.
- Pourquoi le composant ne fait jamais d'appel HTTP direct et passe par le service.
- Ce que fait l'intercepteur et pourquoi il ajoute le jeton à toutes les requêtes, y compris celle de connexion.
- Quelles routes sont publiques ou protégées, et comment le middleware `auth` le décide.
- Le rôle du proxy de développement (`proxy.conf.json`) et pourquoi le navigateur ne parle qu'au port 4200.
- À quoi sert `AGENTS.md` pour un assistant IA, et pourquoi il doit être mis à jour après chaque mission.

## Mission 1 — Inscription, connexion et profil

### Étape 1 — Validation des formulaires et messages d'erreur

**Objectif.** Formulaires d'inscription et de connexion avec des validations et des messages d'erreur compréhensibles (deuxième point de la Mission 1), sans double soumission.

**Prompts.** Prompt principal : le texte de la Mission 1, collé dans l'assistant sans consigne supplémentaire. L'assistant a proposé un plan en quatre étapes, avec des choix par défaut (profil inclus dans le plan, jeton limité aux requêtes `/api`, pré-remplissage de démonstration conservé, code écrit par l'assistant, à relire et à expliquer par moi). J'ai validé ce plan avant toute écriture.

**Plan proposé par l'agent (étape 1).** Inscription : nom d'au moins 2 caractères (après suppression des espaces, comme le backend) et mot de passe d'au moins 8 caractères. Connexion : champs obligatoires et email valide. Messages par champ une fois le champ touché, Signal `submitting` qui désactive le bouton et bloque la double soumission, message du serveur affiché, cas « serveur injoignable ». Un utilitaire partagé `httpErrorMessage` évite de dupliquer la règle dans chaque page.

**Vérifications réalisées.**
- `npm run build` réussi (typage strict des templates inclus).
- 26 vérifications automatisées dans un navigateur Edge sans interface, toutes réussies : champs vides, email invalide, mauvais mot de passe, inscription avec champs trop courts, email déjà utilisé, inscription valide, serveur injoignable (simulé), double clic sur une réponse lente.
- Contrôle manuel dans mon navigateur : champs vides (deux messages, aucune requête dans l'onglet Network), mauvais mot de passe (une requête `401`, message « Identifiants incorrects », bouton réactivé), inscription avec nom et mot de passe trop courts (deux messages, aucune requête).
- Journaux : seul le statut HTTP est affiché, jamais de jeton ni de mot de passe.

**Erreurs ou propositions rejetées.** Aucune pour cette étape. Observation : l'espacement des messages d'erreur est inégal (message collé au bouton) ; correction reportée à la fin de la mission.

**Fichiers effectivement modifiés.** `login-page.ts` et `.html`, `register-page.ts` et `.html`. Créé : `shared/utils/http-error-message.ts`. Le backend n'est pas modifié.

**Preuve de fonctionnement.** Commit `ce12aff`. Captures de l'onglet Network (filtre Fetch/XHR) :
- Champs vides : deux messages d'erreur, aucune requête envoyée (« 0 / 1 requests »).
  ![Champs vides, aucune requête réseau](docs/tp1/img/step1-02-champs-vides-sans-requete.png)
- Mauvais mot de passe : une requête `login` en `401`, message « Identifiants incorrects », bouton réactivé.
  ![Connexion refusée en 401](docs/tp1/img/step1-04-mauvais-mot-de-passe-401.png)
- État initial de la page de connexion (avant toute action) : `docs/tp1/img/step1-01-connexion-etat-initial.png`.

**Ce que je sais maintenant expliquer sans l'agent.** *(à confirmer avant de clore la mission)*
- Pourquoi `if (this.submitting()) return;` est nécessaire en plus du bouton désactivé.
- Pourquoi le template écrit `errors['required']` (signature d'index et `noPropertyAccessFromIndexSignature`).
- Pourquoi les journaux d'erreur n'affichent que le statut.
- Pourquoi `httpErrorMessage` est dans `shared/utils/`.

### Étape 2 — Bouton de déconnexion et navigation selon l'état d'authentification

**Objectif.** Un bouton de déconnexion qui nettoie l'état local (septième point de la Mission 1) et une navigation qui reflète l'état d'authentification.

**Prompts.** Prompt principal : celui de la Mission 1, dont cette étape figurait au plan validé. Validation de l'étape avant écriture, après le commit de l'étape 1.

**Plan proposé par l'agent.** `isLoggedIn = computed(() => token() !== null)` dans `AuthService` ; `AppComponent` injecte `AuthService` et `Router` et expose `logout()` (nettoie l'état, redirige vers `/login`) ; navigation conditionnelle avec `@if` / `@else` : connecté (Backing tracks, Profil, Déconnexion), déconnecté (Connexion, Créer un compte).

**Vérifications réalisées.**
- `npm run build` réussi.
- 17 vérifications automatisées dans un navigateur Edge sans interface, toutes réussies : navigation déconnecté puis connecté, état conservé après rechargement de la page, déconnexion (redirection vers `/login`, jeton retiré de `localStorage`), redirection de `/tracks` et `/profile` vers `/login` après déconnexion, lien « Créer un compte », deuxième cycle connexion/déconnexion.
- Non-régression de l'étape 1 : 23 vérifications sur 23 (sans créer de compte).
- Aucun jeton ni mot de passe dans la console. Contrôle visuel de l'en-tête connecté et déconnecté.

**Erreurs ou propositions rejetées.** Aucune. Observation : l'en-tête est un peu plus haut une fois connecté (le bouton est plus haut que les liens) ; correction reportée avec le reste de la mise en forme, en fin de mission.

**Fichiers effectivement modifiés.** `auth.service.ts`, `app.ts`, `app.html`. Le backend n'est pas modifié.

**Preuve de fonctionnement.** Commit `35034e3`.
**Ce que je sais maintenant expliquer sans l'agent.** *(à confirmer avant de clore la mission)*
- Pourquoi `isLoggedIn` est un `computed` et non un booléen ordinaire.
- Pourquoi la navigation change immédiatement à la déconnexion, sans rechargement.
- Pourquoi la déconnexion ne contacte pas le serveur, et ce que devient le jeton (il reste valide jusqu'à son expiration).

### Étape 3 — Retour vers `/login` sur une réponse 401

**Objectif.** Gérer un `401` avec retour vers `/login` lorsque le jeton est invalide ou expiré (dernier point de la Mission 1).

**Prompts.** Demande de recommandation sur deux décisions de conception (« what do you suggest ») : pas de message « session expirée » pour l'instant, et jeton limité aux requêtes `/api` dans un commit séparé. J'ai suivi ces recommandations.

**Plan proposé par l'agent.** Nouvel intercepteur `error.interceptor.ts` : sur une réponse `401` dont l'URL ne commence pas par `/api/auth/`, appeler `auth.logout()` puis aller vers `/login`, et toujours relancer l'erreur pour que les pages la reçoivent. L'exclusion de `/api/auth/` est nécessaire : un mauvais mot de passe renvoie aussi un `401` et doit s'afficher sur le formulaire. Enregistrement dans `main.ts` : `withInterceptors([authInterceptor, errorInterceptor])`. Raison d'être : le guard ne vérifie que la présence d'un jeton, pas sa validité.

**Vérifications réalisées.**
- `npm run build` réussi.
- 17 vérifications automatisées dans un navigateur Edge sans interface, toutes réussies : jeton invalide (`not-a-jwt`) puis `/tracks` (réponse `401`, retour vers `/login`, jeton retiré, navigation déconnectée, erreur bien relancée à la page) ; jeton bien formé avec une mauvaise signature ; même comportement sur la page profil (`401` sur `/api/users/me`) ; **exclusion** : un mauvais mot de passe alors qu'un jeton valide est enregistré affiche le message, ne déclenche pas l'intercepteur et laisse le jeton intact ; session valide inchangée (`200`, aucune réaction) ; reconnexion possible après le retour.
- Non-régression : étape 2 (17 sur 17) et étape 1 (23 sur 23).
- Limite : je n'ai pas testé un jeton correctement signé mais expiré, car cela demande le secret JWT que je ne dois pas lire. Le backend traite l'expiration et une signature invalide dans la même branche (`jwt.verify` puis `catch`, `app.js:70-76`), qui répond `401` « Jeton invalide ou expiré ».

**Erreurs ou propositions rejetées.** Aucune.

**Fichiers effectivement modifiés.** Créé : `shared/interceptors/error.interceptor.ts`. Modifié : `main.ts`. Le backend n'est pas modifié.

**Preuve de fonctionnement.** Commit `68af9e8`.
**Ce que je sais maintenant expliquer sans l'agent.** *(à confirmer avant de clore la mission)*
- Pourquoi le guard seul ne suffit pas et pourquoi il faut un intercepteur pour le `401`.
- Pourquoi les routes `/api/auth/` sont exclues, et ce qui arriverait sans cette exclusion.
- Pourquoi l'intercepteur relance l'erreur au lieu de l'avaler.
- L'ordre des intercepteurs dans `withInterceptors` (requête dans l'ordre, réponse dans l'ordre inverse).

### Étape 3b — Jeton envoyé uniquement aux requêtes `/api`

**Objectif.** Empêcher que le jeton JWT soit joint à une requête qui ne vise pas l'API (par exemple un service tiers), ce que l'intercepteur fourni ferait pour toute URL.

**Prompts.** Suite des recommandations ci-dessus : validation de la correction dans un commit séparé de l'étape 3.

**Plan proposé par l'agent.** Dans `authInterceptor`, n'ajouter l'en-tête `Authorization` que si un jeton existe **et** que l'URL commence par `/api/`. Écrire d'abord le test et le voir échouer avant la correction.

**Vérifications réalisées.**
- Test écrit avant la correction. Avant : une URL d'une autre origine et une URL de la même origine hors `/api` reçoivent le jeton (échecs attendus, fuite confirmée). Après : 5 vérifications sur 5 (les requêtes `/api` portent le jeton, les autres non).
- Non-régression : étape 3 (17 sur 17), étape 2 (17 sur 17), étape 1 (23 sur 23). Build réussi.
- Le test atteint le `HttpClient` de l'application par un crochet temporaire dans `main.ts`, retiré ensuite ; absence du crochet vérifiée (`main.ts` identique au commit précédent, aucune occurrence dans les sources).
- Limites : le test est un script externe, pas un test versionné (le TP3 demande des tests d'intercepteur dans le dépôt). La condition suppose des URL relatives commençant par `/api/`, comme partout dans l'application.

**Erreurs ou propositions rejetées.** Première tentative pour atteindre le `HttpClient` avec les outils de débogage d'Angular (`window.ng`) : indisponibles dans ce build, remplacée par le crochet temporaire. Un contrôle « aucune requête préliminaire CORS » réussissait même avant la correction : il ne prouvait rien et a été retiré du test.

**Fichiers effectivement modifiés.** `auth.interceptor.ts` (deux lignes). Le backend n'est pas modifié.

**Preuve de fonctionnement.** Commit `51e4cc2`.

**Ce que je sais maintenant expliquer sans l'agent.** *(à confirmer avant de clore la mission)*
- Pourquoi envoyer le jeton à une URL tierce est une fuite d'identifiants, même si l'application ne le fait pas aujourd'hui.
- Pourquoi la condition porte sur `/api/` et ce qu'elle ne couvre pas (URL absolues).
- Pourquoi un test doit d'abord échouer avant la correction.

### Étape 4 — Profil : chargement automatique et retour d'information

**Objectif.** Charger `/api/users/me` lorsque le profil est demandé, et modifier le nom avec `PUT /api/users/me` en affichant clairement le succès ou l'erreur (deux derniers points fonctionnels de la Mission 1).

**Prompts.** Prompt principal : celui de la Mission 1, dont cette étape (retenue après la recommandation de l'assistant) figurait au plan validé. Validation avant écriture.

**Plan proposé par l'agent.** Le profil est chargé à l'ouverture de la page (le bouton « Charger mon profil » disparaît). Signals `loading`, `saving`, `error` et `message`. Le nom est validé comme à l'inscription (obligatoire, 2 caractères après suppression des espaces) avec le validateur `trimmedMinLength`, déplacé dans `shared/validators` dans un commit de refactorisation séparé. Le formulaire s'affiche une fois le profil chargé. Message de succès (classe `.success`), erreurs via `httpErrorMessage`, bouton désactivé pendant l'envoi.

**Vérifications réalisées.**
- `npm run build` réussi.
- 24 vérifications automatisées dans un navigateur Edge sans interface, toutes réussies, sur un compte de test dédié (pas le compte de démonstration), dont le nom est restauré à la fin : chargement automatique (une requête `200`, champ prérempli, plus de bouton), rechargement de la page (profil reconstruit depuis l'API), validation (un caractère, vide, `"  a"`, aucune requête envoyée), enregistrement (`PUT 200`, corps `{name}`, message de succès, nom affiché mis à jour, nom conservé après rechargement), erreur serveur simulée, serveur injoignable simulé, double clic (une seule requête), échec du chargement (message, pas de formulaire), jeton invalide (retour vers `/login`).
- Non-régression : étape 1 (23 sur 23), étape 2 (17 sur 17), étape 3 (17 sur 17). Le test de l'étape 3 a d'abord échoué : il cliquait sur le bouton supprimé, le comportement ayant changé volontairement ; son scénario du profil a été adapté (le `401` survient maintenant au chargement de la page).
- Contrôle visuel de la page profil. Aucun jeton ni mot de passe dans la console.
- Limite : le test de l'étape 3b (jeton limité à `/api`) repose sur un crochet temporaire retiré ; il n'a pas été rejoué, l'intercepteur n'ayant pas changé depuis.

**Erreurs ou propositions rejetées.** Le test de l'étape 3 a planté sur le bouton supprimé (voir ci-dessus). Un compte de test a été créé dans MongoDB Atlas pour les vérifications automatisées ; il a été supprimé à la clôture de la mission.

**Fichiers effectivement modifiés.** `profile-page.ts` et `.html`, `styles.css` (classe `.success`), `register-page.ts` (validateur déplacé). Créé : `shared/validators/trimmed-min-length.ts`. Le backend n'est pas modifié.

**Preuve de fonctionnement.** Commits `238ce7b` (refactorisation du validateur) et `bcc89e9` (profil). Capture de la réponse de `PUT /api/users/me` (onglet Network) : ![Réponse de la modification du profil](docs/tp1/img/users-me-put-reponse.png). Relevé complet des requêtes : `docs/tp1/checkpoint.md`.

**Ce que je sais maintenant expliquer sans l'agent.** *(à confirmer avant de clore la mission)*
- Où s'effectue « la mise à jour du profil » : fichiers côté front (`profile-page.html`, `profile-page.ts`, `auth.service.ts`, intercepteur) et côté back (`app.js` route `PUT /api/users/me`, middleware `auth`, modèle `User`).
- Pourquoi le profil se recharge à chaque ouverture de la page alors que `currentUser` est perdu à l'actualisation.
- Pourquoi la validation côté frontend n'est pas suffisante et ne remplace pas celle du backend.

### Clôture de la Mission 1

**Objectif.** Terminer les livrables du TP1 : questions du sujet, explication Signal / `localStorage`, envoi de fichiers audio avec les traces du backend, mise en forme, mise à jour d'`AGENTS.md`.

**Prompts.** Demande de terminer les livrables restants de la Mission 1 (questions du sujet, documents de synthèse, mise en forme), après l'approbation des commits et des captures d'écran fournies.

**Plan proposé par l'agent.** Committer le relevé Network ; restaurer le nom du compte de démonstration ; tester l'envoi des deux fichiers audio ; rédiger `mission1.md` et `signal-vs-localstorage.md` à partir du code ; corriger l'espacement des messages d'erreur et la hauteur de l'en-tête ; mettre à jour `AGENTS.md` (journal, arborescence, flux).

**Vérifications réalisées.**
- Envoi de `song1.mp3` et `song2.mp3` par l'interface (compte de test) : deux `POST /api/tracks` en `201` (multipart, `Authorization` présent), liste rechargée, lecture en `200` `audio/mpeg`.
- Références de lignes de `mission1.md` revérifiées par recherche dans le code après les modifications.
- En-tête de même hauteur (69,6 px) connecté et déconnecté ; messages d'erreur collés à leur champ (contrôle visuel).
- Non-régression : 81 vérifications automatisées sur 81 (étapes 1 à 4). Recherche de secrets dans les nouveaux documents : aucun.
- Les lignes de journal du backend citées dans `mission1.md` ont été relevées sur un second backend lancé pour l'occasion (port 3001) lors d'un envoi de fichier ; l'ordre réel des lignes `[multer]` a corrigé celui que j'avais déduit du code.
- Nettoyage des données de test : compte de test, ses 3 pistes et ses 3 fichiers audio supprimés (comptes restants : 2, pistes : 0). La consommation de tokens n'a pas été relevée.

**Erreurs ou propositions rejetées.** Aucune.

**Fichiers effectivement modifiés.** Créés : `docs/tp1/mission1.md`, `docs/tp1/signal-vs-localstorage.md`, `docs/tp1/checkpoint.md`. Modifiés : `styles.css`, `AGENTS.md`, notes de contexte en tête de `mission0.md` et `login-flow.md`. Le backend n'est pas modifié.

**Preuve de fonctionnement.** Commits `7cd9fdb` (relevé Network et captures), `f1181da` (mise en forme) et le commit de documentation qui contient ce texte.

**Note sur l'usage de l'IA.** `mission1.md` et `signal-vs-localstorage.md` ont été rédigés par l'assistant à partir du code, pour gagner du temps. Je dois les relire et m'en approprier le contenu avant de les défendre à l'oral.

**Ce que je sais maintenant expliquer sans l'agent.** *(à confirmer : quiz oral sur toutes les étapes de la Mission 1, restant à faire)*
- Répondre aux questions du sujet sans les notes : routes utilisées, chemin de la mise à jour du profil.
- Expliquer la différence entre Signal et `localStorage` et leur usage combiné.
- Où voir les traces du backend et quelles lignes apparaissent lors d'un envoi.

## TP2 — Bibliothèque, upload et lecture audio

### Étape 1 — Analyse du flux existant (prérequis, pagination, upload, lecture)

**Objectif.** Vérifier les prérequis du TP2, comparer la pagination à l'énoncé, et identifier où se trouve chaque étape de l'upload et de la lecture, avant toute modification (première partie de la Mission 3), avec les réponses aux questions sur la mémoire, le buffering et le streaming.

**Prompts.** Prompt principal : le texte d'introduction du TP2 (objectif, prérequis, déroulement conseillé), collé dans l'assistant. J'ai demandé le plan (« whats the plan »), proposé en sept étapes, que j'ai validé avant toute écriture.

**Plan proposé par l'agent.** Vérifier les prérequis (backend, frontend, proxy, connexion, fichiers audio) ; créer la branche `tp2-library` à partir de `tp1-auth` ; relire `tracks-page`, `track.service` et les routes du backend en vérifiant chaque numéro de ligne ; rédiger l'analyse dans `docs/tp2/analyse.md` ; sans modifier de code.

**Vérifications réalisées.** Santé du backend, réponse du frontend, cible du proxy, connexion de démonstration (`200`) et taille des deux fichiers audio (moins de 25 Mo) contrôlées par commande. Numéros de ligne relevés par recherche dans les fichiers avant d'être cités. Les réponses sur le streaming s'appuient sur des lignes précises du code (`res.sendFile`, `diskStorage`, `revokeObjectURL`).

**Erreurs ou propositions rejetées.** Aucune.

**Fichiers effectivement modifiés.** Créé : `docs/tp2/analyse.md`. Aucun code modifié, le backend n'est pas modifié.

**Preuve de fonctionnement.** Commit `e088084`.

**Ce que je sais maintenant expliquer sans l'agent.** *(à confirmer)*
- Où se trouve chaque étape de l'upload et de la lecture, et les deux flux.
- Pourquoi une URL directement dans `src` ne reçoit pas l'en-tête `Authorization`.
- La différence entre téléchargement complet d'un `Blob`, buffering du navigateur et streaming côté serveur.

### Étape 2 — Pagination : message d'erreur et liste robuste

**Objectif.** Compléter la Mission 2 : représenter l'erreur éventuelle de la liste avec un Signal et l'afficher, et s'assurer que la pagination reste cohérente quand une requête échoue.

**Prompts.** Prompt principal : le texte d'introduction du TP2 (voir l'étape 1). Cette étape figurait au plan en sept étapes que j'ai validé ; validation avant écriture, après le commit de l'étape 1.

**Plan proposé par l'agent.** Ajouter un Signal `error` et un message (`httpErrorMessage`). Appliquer la page reçue du serveur (`response.page`) seulement en cas de succès, pour qu'un échec laisse l'indicateur de page et la liste cohérents. Ne pas afficher « Aucune piste. » pendant un chargement ou après une erreur. Désactiver « Préc. » et « Suiv. » pendant un chargement. Le rechargement après un envoi demande la page 1.

**Vérifications réalisées.**
- `npm run build` réussi.
- Test dans un navigateur Edge sans interface, 18 vérifications. Partie A, backend réel : la première requête est `GET /api/tracks?page=1&limit=5`, bibliothèque vide (« Aucune piste. », « Page 1 / 1 », boutons désactivés), aucune erreur affichée. Partie B, bibliothèque simulée de 6 pistes (2 pages de 5) : page 1 puis page 2 avec une **nouvelle requête** à chaque changement (pas de découpage local), « Actualiser » recharge la page courante, erreur au changement de page (message affiché, page et liste inchangées, boutons réutilisables), erreur au chargement initial et serveur injoignable (message sans « Aucune piste. »), boutons désactivés pendant le chargement, un double clic ne produit qu'une requête, aucun jeton ni mot de passe dans la console.
- Le test a d'abord été exécuté contre l'ancien code : 11 vérifications sur 18 (sept échecs attendus : message d'erreur, indicateur de page incohérent, « Aucune piste. » à côté de l'erreur, boutons actifs pendant le chargement). Contre le nouveau code : 18 sur 18.
- Non-régression du TP1 : 23 sur 23, 17 sur 17, 17 sur 17 et 24 sur 24.
- Limite : la bibliothèque de six pistes est simulée par interception des requêtes, car le compte de démonstration n'a aucune piste ; le paramètre `page` réel est vérifié sur le backend réel (partie A).

**Erreurs ou propositions rejetées.** Le premier essai du test contre l'ancien code s'est arrêté sur un délai dépassé au lieu de signaler des échecs : c'était un défaut du test, pas du code. Les attentes ont été rendues non bloquantes puis le test relancé.

**Fichiers effectivement modifiés.** `tracks-page.ts` et `tracks-page.html`. Le backend n'est pas modifié.

**Preuve de fonctionnement.** Commit `d9dd0f4`.

**Ce que je sais maintenant expliquer sans l'agent.** *(à confirmer)*
- Pourquoi chaque changement de page est une requête au serveur et pourquoi il est interdit de tout charger puis de découper dans Angular.
- Pourquoi la page n'est appliquée qu'après une réponse réussie, et ce que la réponse du serveur (`page`, `pages`) garantit.
- Pourquoi désactiver les boutons pendant un chargement (requêtes qui se chevauchent).

### Étape 3 — Upload : contrôles avant envoi, état d'envoi et messages

**Objectif.** Compléter la Mission 3 côté frontend : refuser un fichier invalide avant l'appel HTTP avec un message clair, afficher l'état d'envoi, empêcher la double soumission, afficher les erreurs du serveur et un message de succès, vider le formulaire et recharger la première page.

**Prompts.** Prompt principal : le texte d'introduction du TP2 (voir l'étape 1). Cette étape figurait au plan en sept étapes que j'ai validé ; validation avant écriture, après le commit de l'étape 2.

**Plan proposé par l'agent.** Une fonction pure `audioFileError` dans `shared/utils/audio-file.ts`, avec les mêmes six types et la même limite de 25 Mo que le backend, et `formatSize` pour un affichage lisible. Le fichier choisi devient un Signal, avec `uploading`, `uploadError` et `uploadMessage`. Contrôle à la sélection (retour immédiat) puis juste avant l'envoi. Bouton désactivé et libellé « Envoi… » pendant l'envoi. En cas d'erreur du serveur, message affiché et sélection conservée pour réessayer. En cas de succès : message, titre et champ fichier vidés, page 1 rechargée. Titre vide : nom du fichier.

**Vérifications réalisées.**
- `npm run build` réussi.
- Test dans un navigateur Edge sans interface, 23 vérifications, avec de vrais envois des deux fichiers `song1.mp3` et `song2.mp3` : type refusé sans aucune requête, fichier de 26 Mo refusé sans requête, fichier d'exactement 25 Mo accepté, taille lisible affichée, `POST /api/tracks` en `201` avec un corps `multipart/form-data` contenant les champs `audio` et `title`, message de succès, formulaire vidé, première page rechargée avec la nouvelle piste en tête, titre vide remplacé par le nom du fichier, message de succès effacé au choix d'un nouveau fichier, erreurs serveur `400` et `500` simulées (message affiché, sélection conservée, bouton réactivé), serveur injoignable simulé, un double clic ne produit qu'une requête, aucun jeton ni mot de passe dans la console.
- Le test a d'abord été exécuté contre l'ancien code : 9 vérifications sur 23 (14 échecs attendus, dont un double clic qui envoyait le fichier deux fois). Contre le nouveau code : 23 sur 23.
- Non-régression : pagination (18 sur 18) et TP1 (23, 17, 17 et 24). Contrôle visuel de la carte d'import (état d'erreur et état prêt à envoyer).
- Les pistes de test ont été supprimées après chaque essai.
- Limites : les échecs `400`, `500` et l'indisponibilité du serveur sont simulés par interception. Le type vérifié est celui que fournit le navigateur, comme côté backend : un contrôle du contenu réel des octets reste de la responsabilité du serveur.

**Erreurs ou propositions rejetées.** Une vérification du test échouait à tort : elle cherchait le nom du fichier et trouvait aussi la ligne de la liste apparue après l'envoi. C'était le test, pas le code ; l'assertion a été corrigée après vérification. Le premier essai contre l'ancien code avait déjà montré que les attentes du test devaient être non bloquantes.

**Fichiers effectivement modifiés.** Créé : `shared/utils/audio-file.ts`. Modifiés : `tracks-page.ts`, `tracks-page.html`, `styles.css` (classe `.hint`). Le backend n'est pas modifié.

**Preuve de fonctionnement.** Commit `1842c05`.

**Ce que je sais maintenant expliquer sans l'agent.** *(à confirmer)*
- Pourquoi contrôler le fichier côté frontend **et** côté backend, et pourquoi le premier ne remplace jamais le second.
- Pourquoi le type MIME donné par le navigateur n'est pas une preuve du contenu réel du fichier.
- Pourquoi un Signal `uploading` empêche la double soumission alors que l'attribut `disabled` seul arrive trop tard.
- Pourquoi la sélection et le titre sont conservés quand le serveur répond par une erreur.

### Étape 4 — Cards de bibliothèque lisibles, responsives et accessibles

**Objectif.** Présenter les morceaux sous forme de cards responsives et accessibles, avec le titre, le nom d'origine, le format, la taille, la date d'ajout et une action de lecture (Mission 3).

**Prompts.** Prompt principal : le texte d'introduction du TP2 (voir l'étape 1). Cette étape figurait au plan en sept étapes que j'ai validé ; validation avant écriture, après le commit de l'étape 3.

**Plan proposé par l'agent.** Une liste sémantique `<ul aria-label="Mes pistes">` de `<li>` (avec `@for` et `@empty`, comme le demande le sujet) : titre en `<h3>`, nom d'origine, badge de format (`audioFormat`), taille lisible (`formatSize`), date dans un `<time datetime>` (`formatDate`, en français) et un bouton « ▶ Lire » au nom accessible. Grille CSS `auto-fill` (`minmax(14rem, 1fr)`) : une colonne sur téléphone, plusieurs sur grand écran. Retour à la ligne des noms très longs, contour de focus visible de 3 px, boutons alignés en bas des cards, couleurs à contraste suffisant.

**Vérifications réalisées.**
- `npm run build` réussi.
- Test dans un navigateur Edge sans interface, 13 vérifications : état vide affiché dans la liste ; card réelle après un envoi (titre, nom d'origine, badge MP3, « 3,4 Mo », date lisible, valeur ISO conservée dans `datetime`) et disparition de l'ancien affichage en octets bruts ; liste étiquetée, chaque card avec un titre, bouton au nom accessible ; lecture depuis la card (requête audio authentifiée en `200`, URL `blob:` donnée au lecteur) ; mise en page à 1000 px (2 colonnes) et à 400 px (1 colonne) avec un titre de 120 caractères et un nom de fichier très long : aucun débordement horizontal ; navigation au clavier avec contour de focus visible ; contrastes calculés à partir des styles réels, tous supérieurs à 4,5:1 (13,25 ; 6,11 ; 6,11 ; 10,09 ; 5,59).
- Contre l'ancien balisage, le test échoue dès la première vérification. Contre le nouveau : 13 sur 13.
- Non-régression : envoi (23 sur 23), pagination (18 sur 18) et TP1 (23, 17, 17 et 24). Contrôle visuel des captures bureau et téléphone. Les pistes de test ont été supprimées après chaque essai.
- Limites : mise en page vérifiée dans Edge seulement, lecteur d'écran non testé, contraste vérifié par calcul.

**Erreurs ou propositions rejetées.** Au contrôle visuel, les boutons de lecture n'étaient pas alignés en bas quand le contenu des cards différait : corrigé (mise en page en colonne, marge automatique). Le test contre l'ancien balisage s'arrête au premier échec au lieu de lister tous les écarts. Le test de l'étape 3 a dû être adapté au nouveau balisage (titre dans un `h3`).

**Fichiers effectivement modifiés.** Créé : `shared/utils/format-date.ts`. Modifiés : `shared/utils/audio-file.ts` (`audioFormat`), `tracks-page.ts`, `tracks-page.html`, `styles.css`. Le backend n'est pas modifié.

**Preuve de fonctionnement.** Commit `595e622`.

**Ce que je sais maintenant expliquer sans l'agent.** *(à confirmer)*
- Pourquoi une liste sémantique avec des titres et des noms accessibles aide les lecteurs d'écran et la navigation au clavier.
- Pourquoi `<time datetime>` : un texte lisible pour l'humain et une valeur ISO pour les machines.
- Comment la grille `auto-fill` rend l'interface responsive sans règle par taille d'écran, et pourquoi `overflow-wrap` évite les débordements.
- Ce que signifie un contraste de 4,5:1 (niveau AA) et comment il se calcule.

### Étape 5 — Lecture : morceau en cours, erreurs claires, libération de l'ObjectURL

**Objectif.** Compléter la lecture (Mission 3) : afficher le morceau en cours, afficher une erreur audio compréhensible, et révoquer l'`ObjectURL` finale à la destruction du composant.

**Prompts.** Prompt principal : le texte d'introduction du TP2 (voir l'étape 1). Cette étape figurait au plan en sept étapes que j'ai validé ; validation avant écriture, après le commit de l'étape 4.

**Plan proposé par l'agent.**
- Un Signal `currentTrack` et une section « Lecteur » (`aria-label`) avec « En cours : titre » ; la card jouée est mise en évidence et marquée `aria-current`.
- Un état de chargement « Chargement du morceau… » (`role="status"`), car le fichier est téléchargé entièrement avant d'être lu.
- Chaque nouvelle lecture annule la précédente (`unsubscribe`) : une réponse tardive pour un morceau ancien ne peut pas remplacer un choix plus récent.
- Un Signal `audioError` pour les échecs de requête (piste introuvable, erreur serveur, serveur injoignable) et pour l'élément `<audio>` lui-même (`mediaErrorMessage`, selon `MediaError.code` : interrompu, réseau, fichier corrompu, format non pris en charge).
- `setAudioUrl` révoque l'URL précédente à chaque remplacement, et `DestroyRef.onDestroy` révoque la dernière URL et annule la requête en cours.

**Vérifications réalisées.**
- `npm run build` réussi.
- Test dans un navigateur Edge sans interface, 17 vérifications, avec deux vrais morceaux envoyés puis lus : titre en cours affiché dans un lecteur étiqueté, card jouée mise en évidence avec `aria-current`, URL `blob:` donnée au lecteur ; **lecture réelle** : le navigateur charge les métadonnées et décode le fichier (durée de 180 s, aucune erreur du lecteur) ; état de chargement pendant un téléchargement lent ; un clic sur B pendant le téléchargement de A ignore la réponse tardive de A (une seule URL créée) ; l'URL précédente est révoquée quand on change de morceau ; l'URL finale est révoquée en quittant la page et **toutes les URL créées sont révoquées (4 créées, 4 révoquées)** ; erreurs `404`, `500`, serveur injoignable et fichier indécodable chacune avec un message clair et sans lecteur cassé ; reprise normale après une erreur ; aucun jeton ni mot de passe dans la console.
- Le test a d'abord été exécuté contre l'ancien code : 7 vérifications sur 17. Les échecs révèlent de vrais défauts : trois URL créées au lieu d'une par les réponses tardives, et la dernière URL jamais révoquée en quittant la page (5 créées, 4 révoquées). Contre le nouveau code : 17 sur 17.
- Non-régression : cards (13 sur 13), envoi (23 sur 23), pagination (18 sur 18) et TP1 (23, 17, 17 et 24). Contrôle visuel du lecteur. Les pistes de test ont été supprimées après chaque essai.
- Limites : les erreurs `404`, `500`, l'indisponibilité du serveur et le fichier indécodable sont simulés par interception ; la lecture réelle est prouvée par le chargement des métadonnées et le décodage, pas par l'écoute ; Edge seulement.

**Erreurs ou propositions rejetées.** Aucune pour cette étape. Point de conception : avec `responseType: 'blob'`, le corps d'une erreur JSON du serveur arrive sous forme de `Blob` et n'est pas lisible directement ; les messages d'erreur audio sont donc choisis d'après le statut HTTP.

**Fichiers effectivement modifiés.** `tracks-page.ts`, `tracks-page.html`, `styles.css` et `shared/utils/audio-file.ts` (`mediaErrorMessage`). Le backend n'est pas modifié.

**Preuve de fonctionnement.** Commit `63cf2d9`.

**Ce que je sais maintenant expliquer sans l'agent.** *(à confirmer)*
- La différence entre téléchargement complet d'un `Blob`, buffering du navigateur et streaming côté serveur, et pourquoi ce choix impose un temps de chargement avant la lecture.
- Pourquoi une `ObjectURL` doit être révoquée (le `Blob` reste en mémoire tant qu'elle existe) et où ce code le fait : au remplacement et à la destruction du composant.
- Pourquoi une requête plus ancienne doit être annulée quand l'utilisateur fait un nouveau choix (réponses dans le désordre).
- Comment on distingue une erreur de requête (HTTP) d'une erreur du lecteur (`MediaError`).

### Étape 6 — Preuves réseau du TP2

**Objectif.** Vérifier et documenter les cinq points du checkpoint réseau du TP2 : chaque changement de page modifie le paramètre `page`, l'upload est multipart avec `audio` et `title`, une erreur `400` pour un fichier invalide, la réponse de lecture est un flux audio, et une piste n'est lisible que par son propriétaire.

**Prompts.** Prompt principal : le texte d'introduction du TP2 (voir l'étape 1). Cette étape figurait au plan en sept étapes que j'ai validé ; validation avant écriture, après le commit de l'étape 5.

**Plan proposé par l'agent.** Envoyer six pistes réelles avec un compte de test dédié, puis relever la structure des requêtes et des réponses (statut, en-têtes utiles, clés JSON) sans jamais reproduire un jeton : pagination et bornes du serveur, envoi multipart, refus de fichiers en appelant l'API directement (puisque l'interface les bloque d'abord), lecture avec et sans en-tête `Range`, accès d'un autre utilisateur ou sans jeton. Compléter par un passage dans le navigateur sur les données réelles.

**Vérifications réalisées.**
- Pagination : `page=1` (5 éléments), `page=2` (1 élément), bornes imposées par le serveur (`page=0&limit=1000` donne `page` 1 et `limit` 20), page hors limites (liste vide). Dans le navigateur, « Suiv. » puis « Préc. » produisent trois requêtes (`page=1`, `page=2`, `page=1`), toutes avec `Authorization`.
- Refus : fichier `text/plain` (`400`), fichier de 26 Mo (`400`), aucun fichier (`400`), aucun jeton (`401`) ; aucune piste créée par ces envois.
- Lecture : `200` avec `Content-Type: audio/mpeg`, `Content-Length` égal aux octets reçus et à la taille du fichier sur le disque ; avec `Range: bytes=0-99`, réponse `206` et `Content-Range: bytes 0-99/3605337`, ce qui confirme la lecture en flux depuis le disque.
- Propriétaire : un autre utilisateur reçoit `404` « Piste inconnue » (et non `403`), l'absence de jeton ou un jeton invalide donnent `401`, et la liste de l'autre compte n'affiche pas ces pistes.
- Limites : ces relevés viennent de requêtes directes et d'un script ; les captures de l'onglet Network sont ajoutées séparément. Le refus de taille renvoyé directement par l'API est le message par défaut de Multer, en anglais (« File too large »), que l'interface ne montre pas puisqu'elle refuse le fichier avant l'envoi.

**Erreurs ou propositions rejetées.** Aucune pour cette étape.

**Fichiers effectivement modifiés.** Créé : `docs/tp2/checkpoint.md`. Aucun code modifié, le backend n'est pas modifié.

**Preuve de fonctionnement.** Commit : [hash à ajouter]. Captures de l'onglet Network : [à ajouter].

**Ce que je sais maintenant expliquer sans l'agent.** *(à confirmer)*
- Pourquoi les bornes de pagination sont imposées par le serveur et pas seulement par l'interface.
- Pourquoi un refus `400` s'observe en appelant l'API directement, alors que l'interface bloque d'abord le fichier, et pourquoi les deux contrôles sont nécessaires.
- Ce que montrent `Accept-Ranges` et la réponse `206` : le serveur envoie le fichier en flux depuis le disque.
- Pourquoi le backend répond `404` et non `403` pour la piste d'un autre utilisateur.
