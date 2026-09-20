# TP3 — Rapport de tests et preuves

Ce document rassemble les tests automatisés du dépôt, les vérifications faites dans un navigateur réel, le relevé réseau et les réponses écrites du TP3 (Missions 5, 6 et 7).

## Commandes

| Commande | Où | Résultat observé |
|---|---|---|
| `npm test` | `frontend-starter/` | 4 fichiers, **26 tests réussis** |
| `npm test` | `backend/` | **10 tests réussis** (2 existants + 8 ajoutés) |
| `npm run build` | `frontend-starter/` | build réussi, aucune erreur ; bundle initial 437,8 Ko (107,5 Ko transférés) |

Aucun de ces tests ne dépend d'un backend ni de MongoDB en fonctionnement : côté frontend, `HttpTestingController` remplace le réseau ; côté backend, les cas choisis se terminent avant tout accès à la base.

## Tests frontend (Mission 7)

| Fichier | Vérifie | Attendu | Observé |
|---|---|---|---|
| `track.service.spec.ts` | `list()` | `GET /api/tracks` avec `page` et `limit` (valeurs données, puis 1 et 5 par défaut), résultat simulé renvoyé | conforme |
| | `delete()` | `DELETE /api/tracks/:id`, sans corps, se termine sur `204` | conforme |
| | `upload()` | `POST` multipart (`audio`, `title`) avec `reportProgress` ; événements convertis en pourcentages arrondis puis en piste créée ; total inconnu donne `null` (jamais `NaN`) ; erreur HTTP propagée | conforme (4 tests) |
| `auth.interceptor.spec.ts` | intercepteur | `Authorization: Bearer …` sur `/api/` avec token ; aucun en-tête sans token ; aucun en-tête vers une autre origine | conforme (3 tests) |
| `auth.guard.spec.ts` | guard | redirige vers `/login` sans token ; laisse passer avec un token | conforme (2 tests) |
| `tracks-page.spec.ts` | liste | un échec HTTP affiche un message d'erreur et pas « Aucune piste. » | conforme |
| | suppression | confirmation avant tout envoi ; `DELETE` puis rechargement ; Annuler n'envoie rien ; double clic = une seule requête ; `404` = message clair + rechargement ; serveur injoignable = message, pas de rechargement ; dernière piste de la page 2 = retour page 1 | conforme (6 tests) |
| | upload | états `idle`, `uploading`, `success`, `error` ; pourcentage affiché ; 100 % n'est pas la réussite ; total inconnu sans `NaN` ; contrôles désactivés puis réactivés ; pas de second envoi ; fichier conservé après échec | conforme (7 tests) |

### Ces tests peuvent-ils échouer ?
Pour ne pas se contenter de tests qui passent toujours, le code a été **cassé volontairement**, un défaut à la fois, puis restauré. Chaque casse a fait échouer le test prévu :

| Casse volontaire | Test qui échoue |
|---|---|
| `limit` retiré des paramètres de `list()` | les 2 tests de `list()` |
| filtre `/api/` retiré de l'intercepteur | « n'envoie pas le token à une autre origine » |
| en-tête `Authorization` jamais posé | « ajoute Authorization… » |
| guard qui laisse tout passer | « redirige vers /login » |
| confirmation ignorée | plusieurs tests de suppression |
| garde anti double clic retirée (suppression, envoi) | les tests de double clic |
| pas de retour à la page précédente | « dernière piste de la page 2 » |
| pas de rechargement sur `404` | test du `404` |
| `reportProgress` oublié, pourcentage brut, total inconnu traité comme 0 | les tests de progression |
| titre jamais désactivé / jamais réactivé | tests d'upload (a révélé un manque de test, corrigé) |

## Tests backend facultatifs (`backend/test/contract.test.js`)

Huit tests, sans modifier les routes : `401` sans JWT (`GET`, `POST` et `DELETE`), `401` avec un texte quelconque, un JWT signé avec un autre secret et un JWT expiré, upload sans fichier (`400`, « Fichier audio requis »), type `text/plain` refusé (`400`). Trois casses volontaires de `app.js` (authentification acceptée sans en-tête, signature non vérifiée, fichier absent accepté) ont été détectées, puis `app.js` a été restauré.

**Non couverts ici :** la pagination avec `page` et `limit` et l'accès à la piste d'un autre utilisateur exigent une base de données. Ils ont été vérifiés par requêtes réelles (`docs/tp2/checkpoint.md` pour la pagination ; le `404` sur la piste d'un autre utilisateur est aussi vérifié pour la suppression ci-dessous).

## Vérifications dans un navigateur réel

Un navigateur Edge sans interface, piloté par un script conservé hors du dépôt, avec le vrai backend et la vraie base.

**Suppression : 27 vérifications réussies.** Confirmation sans requête, focus clavier sur « Annuler », Échap, état « Suppression… » avec boutons désactivés, une seule requête `DELETE` malgré un double clic, rechargement, SnackBar « Piste « … » supprimée. », piste absente côté serveur (`GET audio` donne `404`), piste supprimée dans un autre onglet (message « n'existe plus », liste actualisée), piste d'un autre utilisateur (`404`, sa piste reste intacte), sans jeton (`401`), suppression de la piste en cours de lecture (lecteur fermé, ObjectURL libéré : 1 créée, 1 révoquée), serveur injoignable (message, la piste reste), dernière piste de la page 2 (retour page 1), aucun jeton ni mot de passe dans la console.

**Progression de l'upload : 14 vérifications réussies.** Avec un débit d'envoi limité à environ 1,2 Mo/s (le fichier de 6,1 Mo met alors environ 5 s), vingt pourcentages réels ont été observés : `0, 6, 10, 14, 19, 25, 29, 35, 42, 46, 52, 56, 62, 66, 70, 76, 81, 85, 91, 95`, sans recul, puis la réussite après la réponse du serveur. Champ fichier, titre et bouton désactivés pendant l'envoi ; un clic forcé n'a créé aucun second `POST` ; échec `400` et serveur injoignable affichent un message et réactivent les contrôles.

**Non-régression : 193 vérifications réussies sur le code final** (TP1 : 81 ; TP2 : 71 ; TP3 : 41).

## Relevé réseau

Relevé fait par script (structure uniquement, valeur du jeton jamais relevée), pas depuis l'onglet Network des outils de développement.

| Requête | Statut | En-têtes utiles |
|---|---|---|
| `POST /api/tracks` (upload) | `201` | `Authorization` présent ; requête `multipart/form-data` ; réponse JSON de 200 octets (métadonnées de la piste) |
| `GET /api/tracks?page=1&limit=5` (rechargement) | `200` | `Authorization` présent ; JSON |
| `DELETE /api/tracks/:id` | `204` | `Authorization` présent ; aucun corps, aucun `Content-Type` |
| `GET /api/tracks?page=1&limit=5` (après suppression) | `200` | la liste sans la piste |

**Limite :** l'onglet Network n'affiche pas les événements de progression un par un ; la preuve de la progression est la suite des pourcentages ci-dessus, et une mesure directe sur `XMLHttpRequest` qui a compté 53 événements de progression pendant les 5,5 s de l'envoi limité.

## Un défaut trouvé seulement dans le navigateur

Le premier essai réel de la progression n'a jamais dépassé `0 %`, alors que les tests unitaires passaient. Cause : depuis les versions récentes d'Angular, `HttpClient` utilise `fetch` par défaut, et `fetch` ne sait pas rapporter la progression d'un envoi. `HttpTestingController` remplace le transport, donc aucun test unitaire ne pouvait le voir. Correction : `withXhr()` dans `main.ts`. Le même essai réel donne maintenant les vingt pourcentages ci-dessus. Les 81 vérifications du TP1 et les 71 du TP2 ont été relancées après ce changement de transport.

## Réponses écrites

**Pourquoi la suppression passe par `TrackService` ?** Le composant s'occupe de l'affichage et de l'état (confirmation, attente, messages) ; l'appel HTTP (URL, méthode) est isolé dans le service, ce qui le rend réutilisable et testable seul, sans composant.

**Pourquoi le guard et l'interface ne suffisent pas à sécuriser la suppression ?** Ils ne font que cacher ou refuser une navigation dans le navigateur, que l'utilisateur contrôle : n'importe qui peut envoyer un `DELETE` avec `curl`. Le backend vérifie réellement le JWT (`401` sans jeton valide) et cherche la piste avec l'identifiant du propriétaire tiré du jeton : la piste d'un autre utilisateur donne `404`, et la piste reste intacte (vérifié).

**Pourquoi un upload avec progression ne se traite pas comme une requête à réponse unique ?** Avec `observe: 'events'`, la requête émet plusieurs événements (envoi, progression, réponse) au lieu d'un seul corps ; il faut filtrer par type, calculer le pourcentage `loaded / total` (inconnu si `total` est absent), et ne considérer l'envoi comme réussi qu'à l'événement de réponse : 100 % signifie « tout est parti », pas « le serveur a fini ».

**Pourquoi les tests HTTP n'ont pas besoin de MongoDB ?** Ils testent le frontend : `HttpTestingController` intercepte la requête sortante, on vérifie son URL, sa méthode, ses paramètres et ses en-têtes, puis on simule la réponse. Aucun serveur n'est contacté.

**Que vérifie un test d'intercepteur ou de guard ?** Le comportement de la fonction avec un contexte simulé : l'intercepteur ajoute (ou non) `Authorization` selon le token et l'URL ; le guard renvoie `true` avec un token et un chemin vers `/login` sans token.

**Test unitaire et test d'intégration ?** Un test unitaire vérifie une brique isolée (le service seul, avec un réseau simulé). Un test d'intégration vérifie plusieurs briques réellement assemblées (ici, le navigateur, le frontend, le backend et la base : nos vérifications dans un navigateur réel).
