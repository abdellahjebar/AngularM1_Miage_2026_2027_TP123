# TP2 — Checkpoint : observations réseau

Relevés faits sur le backend réel avec un compte de test dédié (six pistes envoyées), par requêtes directes à l'API et par un passage dans un navigateur. Seule la structure est reproduite : aucun jeton ni mot de passe n'apparaît ici.

## 1. Chaque changement de page modifie le paramètre `page`

Requêtes directes à l'API :

| Requête | Statut | Résultat |
|---|---|---|
| `GET /api/tracks?page=1&limit=5` | `200` | 5 éléments, `page` 1, `total` 6, `pages` 2 |
| `GET /api/tracks?page=2&limit=5` | `200` | 1 élément, `page` 2 |
| `GET /api/tracks?page=0&limit=1000` | `200` | valeurs ramenées aux bornes du serveur : `page` 1, `limit` 20 |
| `GET /api/tracks?page=99&limit=5` | `200` | 0 élément, `page` 99, `pages` 2 (liste vide, pas d'erreur) |

Dans le navigateur (compte de test, six pistes), un clic sur « Suiv. » puis sur « Préc. » produit trois requêtes, toutes avec l'en-tête `Authorization` :

1. `GET /api/tracks?page=1&limit=5` → `200`, 5 éléments (chargement de la page) ;
2. `GET /api/tracks?page=2&limit=5` → `200`, 1 élément (clic sur « Suiv. ») ;
3. `GET /api/tracks?page=1&limit=5` → `200`, 5 éléments (clic sur « Préc. »).

Chaque changement de page est donc une nouvelle requête au serveur : rien n'est chargé puis découpé dans Angular. Les bornes (`page` au moins 1, `limit` au plus 20) sont imposées par le backend, pas seulement par l'interface.

## 2. L'upload est multipart et contient `audio` et `title`

| Cas | Statut | Réponse |
|---|---|---|
| Envoi valide (`multipart/form-data`, champs `audio` et `title`) | `201` | `id`, `ownerId`, `title`, `originalName`, `mimeType`, `size`, `createdAt` |

Le corps envoyé par l'interface a été vérifié : type `multipart/form-data` avec exactement les champs `audio` et `title` (test de l'étape 3).

## 3. Une erreur `400` pour un fichier invalide

L'interface refuse d'abord un fichier invalide, avant tout envoi. Pour observer la réponse réelle du backend, l'API a été appelée directement, sans passer par l'interface :

| Cas | Statut | Réponse |
|---|---|---|
| Fichier `text/plain` | `400` | `{"message":"Format audio non accepté"}` |
| Fichier audio de 26 Mo (limite : 25 Mo) | `400` | `{"message":"File too large"}` (message de Multer, en anglais) |
| Aucun fichier dans le formulaire | `400` | `{"message":"Fichier audio requis"}` |
| Aucun jeton | `401` | `{"message":"Authentification requise"}` |

Les envois refusés n'ont créé aucune piste (le total est resté à 6). L'affichage du message d'erreur du serveur par l'interface est vérifié avec une réponse `400` simulée (test de l'étape 3).

## 4. La réponse de lecture est un flux audio

| Requête | Statut | Détail |
|---|---|---|
| `GET /api/tracks/:id/audio` | `200` | `Content-Type: audio/mpeg` ; `Content-Length` = octets reçus = taille du fichier sur le disque (3 605 337) |
| Même requête avec `Range: bytes=0-99` | `206` | `Content-Range: bytes 0-99/3605337`, 100 octets reçus ; l'en-tête `Accept-Ranges: bytes` est présent |

Le serveur sait donc envoyer une partie du fichier à la demande : il lit le fichier sur le disque en flux, il ne le charge pas entièrement en mémoire. Notre interface, elle, télécharge le fichier complet en `Blob` avant de le lire.

## 5. Une piste n'est lisible que par son propriétaire

| Demande | Statut | Réponse |
|---|---|---|
| Autre utilisateur (compte de démonstration) demande l'audio de la piste | `404` | `{"message":"Piste inconnue"}` |
| Aucun jeton | `401` | `{"message":"Authentification requise"}` |
| Jeton invalide | `401` | `{"message":"Jeton invalide ou expiré"}` |
| Liste du compte de démonstration | `200` | `total` 0 : les pistes de l'autre compte n'y figurent pas |

Le backend filtre toujours sur `ownerId` pris dans le jeton. Il répond `404` et non `403` : il ne révèle pas qu'une piste appartenant à quelqu'un d'autre existe.
