# TP1 — Mission 1 : questions du sujet

Références de lignes vérifiées sur l'état du code à la fin de la Mission 1.

## Quelles routes du backend sont utilisées ?

Sept routes sur les neuf du contrat (`API_CONTRACT.md`) sont appelées par le frontend :

| Route | Appelée depuis |
|---|---|
| `POST /api/auth/register` | `auth.service.ts:23` (`register`) |
| `POST /api/auth/login` | `auth.service.ts:17` (`login`) |
| `GET /api/users/me` | `auth.service.ts:30` (`profile`) |
| `PUT /api/users/me` | `auth.service.ts:36` (`update`) |
| `GET /api/tracks?page&limit` | `track.service.ts:12` (`list`) |
| `POST /api/tracks` | `track.service.ts:21` (`upload`) |
| `GET /api/tracks/:id/audio` | `track.service.ts:25` (`audio`) |

Non utilisées par le frontend : `GET /api/health` (vérification manuelle) et `DELETE /api/tracks/:id` (prévue au TP3).

## Où s'effectue « la mise à jour du profil utilisateur » ?

**Côté frontend** (de l'écran vers l'API) :
1. `components/profile-page/profile-page.html:14` : le formulaire déclenche `save()` à la soumission.
2. `components/profile-page/profile-page.ts:47-59` : `save()` vérifie le formulaire puis appelle `auth.update(...)` (ligne 59).
3. `shared/services/auth.service.ts:34-38` : `update(name)` envoie `PUT /api/users/me` avec `{ name }` (ligne 36) et met à jour le Signal `currentUser`.
4. `shared/interceptors/auth.interceptor.ts:8-13` : ajoute `Authorization: Bearer <jeton>` car l'URL commence par `/api/`.

**Côté backend** :
1. `backend/src/app.js:249` : route `PUT /api/users/me`, protégée par le middleware `auth` (`app.js:56-77`), qui vérifie le jeton (`jwt.verify`, ligne 70) et place son contenu dans `req.auth`.
2. `app.js:251-255` : `User.findByIdAndUpdate(req.auth.sub, { $set: { name } }, { new: true, runValidators: true })` : l'identifiant vient du jeton, jamais du corps de la requête.
3. `backend/src/models/User.js:10` : la validation du nom (obligatoire, `trim`, 2 caractères minimum).
4. `app.js:263` : la réponse passe par `toPublic()` (`User.js:52-59`), qui n'expose ni l'empreinte du mot de passe ni rien de sensible.

## Quel modèle d'IA, combien de tokens, qui conseille ?

- **Modèle utilisé** : Claude Sonnet 5, dans Claude Code (extension VS Code).
- **Consommation de tokens** : elle se relève dans l'outil (indicateur de contexte et page d'utilisation du compte) ; le chiffre exact n'est pas reporté ici tant qu'il n'a pas été relevé.
- **Qui conseille le meilleur modèle** : l'assistant lui-même, avec le prompt proposé dans le guide du cours (§10), à recouper avec la documentation du fournisseur ; l'enseignant peut aussi orienter.

## Préparation : où se trouvent les traces du backend ?

Dans le **terminal où le backend a été lancé** (`cd backend`, `npm start`) : le serveur écrit ses journaux avec `console.log`, `console.warn` et `console.error`. Relevé réel lors de l'envoi de `song1.mp3` (identifiants remplacés par `<id>`) :

```text
[auth] Token accepté pour <id>                          (app.js:71)
[multer] Type accepté : audio/mpeg                      (app.js:112)
[multer] Destination sélectionnée : …\backend\data\uploads   (app.js:90)
[multer] Nom de stockage généré pour song1.mp3          (app.js:96)
[tracks] Upload enregistré : <id>                       (app.js:354)
[track-model] Préparation de la piste publique <id>     (Track.js:33)
[http] POST /api/tracks -> 201 (75 ms)                  (app.js:136)
```

La ligne `[http]` est écrite en dernier, à la fin de la réponse. Ces lignes ne contiennent ni mot de passe ni jeton.

Relevé côté navigateur (onglet Network, filtre Fetch/XHR) lors de l'envoi des deux fichiers de `fichiers-audio-de-test/` puis de la lecture de l'un d'eux :

| Requête | Statut | Détail |
|---|---|---|
| `POST /api/tracks` (×2) | `201` | `multipart/form-data`, `Authorization` présent, réponse : `id`, `ownerId`, `title`, `originalName`, `mimeType`, `size`, `createdAt` |
| `GET /api/tracks?page=1&limit=5` | `200` | réponse : `items`, `page`, `limit`, `total`, `pages` |
| `GET /api/tracks/:id/audio` | `200` | `audio/mpeg`, 6 405 141 octets ; l'élément `<audio>` reçoit une URL `blob:` |
