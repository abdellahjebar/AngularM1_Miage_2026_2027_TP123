# TP1 — Checkpoint : observations dans l'onglet Network

Filtre Fetch/XHR. Aucun mot de passe ni jeton n'est reproduit : seules les clés des objets JSON sont indiquées, et la valeur de l'en-tête `Authorization` est masquée sur les captures. Les relevés ont été faits dans l'onglet Network et recoupés par un script de test automatisé (navigateur Edge sans interface).

| Cas | Requête | Corps JSON (clés) | Statut | Réponse (clés) | `Authorization` |
|---|---|---|---|---|---|
| Connexion réussie, aucun jeton enregistré | `POST /api/auth/login` | `email`, `password` | `200` | `token`, `user` | absent |
| Connexion réussie, jeton déjà enregistré | `POST /api/auth/login` | `email`, `password` | `200` | `token`, `user` | **présent** |
| Connexion refusée (mauvais mot de passe), aucun jeton | `POST /api/auth/login` | `email`, `password` | `401` | `message` | absent |
| Connexion refusée, jeton déjà enregistré | `POST /api/auth/login` | `email`, `password` | `401` | `message` | **présent** |
| Lecture du profil | `GET /api/users/me` | aucun | `200` | `id`, `name`, `email`, `createdAt` | présent |
| Modification du nom | `PUT /api/users/me` | `name` | `200` | `id`, `name`, `email`, `createdAt` | présent |

## Captures

Connexion réussie avec un jeton déjà enregistré (`Authorization` présent, valeur masquée) :

![Requête de connexion, statut 200](img/login-200.png)

Connexion refusée, `401` et message « Identifiants incorrects » :

![Connexion refusée en 401](img/step1-04-mauvais-mot-de-passe-401.png)

Réponse de la requête `PUT /api/users/me` (onglet Response) : le nom a été mis à jour, et la réponse ne contient ni jeton ni empreinte du mot de passe.

![Réponse de la modification du profil](img/users-me-put-reponse.png)

## Ce qu'on en retient

- L'en-tête `Authorization` est présent sur la requête de connexion lorsqu'un jeton est déjà enregistré : l'intercepteur l'ajoute à toute requête dont l'URL commence par `/api/`, y compris `/api/auth/login`. Le serveur l'ignore sur cette route, qui n'exige pas de jeton.
- Un mauvais mot de passe renvoie `401` avec un simple `message` : l'intercepteur qui gère le `401` exclut les routes `/api/auth/`, l'erreur reste donc affichée sur le formulaire.
- Les réponses du profil n'exposent que `id`, `name`, `email` et `createdAt` : jamais l'empreinte du mot de passe (`toPublic()`, `User.js`).
