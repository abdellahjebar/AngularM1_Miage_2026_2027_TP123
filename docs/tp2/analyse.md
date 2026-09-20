# TP2 — Analyse : pagination, upload et lecture audio

Références de lignes vérifiées sur le code au début du TP2 (branche `tp2-library`, créée à partir de `tp1-auth`). Le backend n'est pas modifié.

> Ce document décrit l'état du code **au début du TP2** : les numéros de ligne et la liste « Ce qui reste à compléter » correspondent à cet état initial. Les manques listés ont été traités aux étapes 2 à 5 (voir `RAPPORT_IA_MODELE.md`).

## Prérequis vérifiés

| Vérification | Résultat |
|---|---|
| Backend démarré, `GET /api/health` | `{"status":"ok"}` |
| Frontend sur le port 4200 | répond `200` |
| Cible du proxy (`proxy.conf.json`) | `http://localhost:3000` |
| Connexion du compte de démonstration | `200` |
| Fichiers de `fichiers-audio-de-test/` (limite : 25 Mo) | `song1.mp3` 3 605 337 octets, `song2.mp3` 6 405 141 octets |

## Mission 2 — Bibliothèque paginée : état du code fourni

| Exigence du sujet | État |
|---|---|
| `TrackService.list(page, limit)` transmet réellement `page` et `limit` | oui (`track.service.ts:11-13`, `params: { page, limit }`) |
| Signals `tracks`, `page`, `pages`, `loading` | oui (`tracks-page.ts:14-17`) |
| Signal pour l'erreur | **non** : l'échec n'est journalisé que dans la console (`tracks-page.ts:41`) |
| `@for` avec `@empty`, `@if` pour le chargement | oui (`tracks-page.html:21-34`) |
| « Précédent » et « Suivant » désactivés aux bornes | oui (`tracks-page.html:36` et `38`) |
| Chaque changement de page relance une requête, sans découpage local | oui (`go()` appelle `load()`, `tracks-page.ts:47-49`) |

Côté backend, `page` vaut au moins 1 et `limit` est borné entre 1 et 20 (5 par défaut) (`app.js:273-274`). La réponse contient `items`, `page`, `limit`, `total` et `pages`, avec `pages = max(1, ceil(total / limit))` (`app.js:315`).

## Mission 3 — Où se trouve chaque étape de l'upload et de la lecture ?

| Étape | Fichier et ligne |
|---|---|
| Choix du fichier | `tracks-page.html:12` (`<input type="file" accept="audio/*" (change)="choose($event)">`), puis `tracks-page.ts:26-29` qui mémorise `this.file` |
| Construction du `FormData` | `track.service.ts:18-20` : champs `audio` et `title` |
| Appel HTTP d'upload | `track.service.ts:21` (`POST /api/tracks`), déclenché par `tracks-page.ts:52-55` |
| Récupération du `Blob` | `track.service.ts:24-27` (`responseType: 'blob'`), appelé par `tracks-page.ts:68` |
| Création de l'`ObjectURL` | `tracks-page.ts:73` : `URL.createObjectURL(blob)` |
| Affectation au lecteur `<audio>` | Signal `audioUrl` (`tracks-page.ts:18`) puis `<audio [src]="audioUrl()">` (`tracks-page.html:41`) |
| Révocation de l'ancienne URL | `tracks-page.ts:71-72` (`URL.revokeObjectURL(previousUrl)`) |

### Les deux flux

**Upload :** composant (`tracks-page`) → `TrackService.upload()` → `HttpClient` → `authInterceptor` (ajoute `Authorization`, l'URL commence par `/api/`) → API : middleware `auth` → Multer (`upload.single("audio")`) → `Track.create` → réponse `201`.

**Lecture :** clic sur ▶ → `TrackService.audio(id)` → `HttpClient` (`GET /api/tracks/:id/audio`, avec `Authorization`) → API : `auth`, vérification du propriétaire, `res.sendFile` → un `Blob` revient au composant → `URL.createObjectURL(blob)` → Signal `audioUrl` → `<audio>`.

### Pourquoi une URL placée directement dans `src` ne reçoit-elle pas l'en-tête `Authorization` ?

Un élément `<audio src="...">` déclenche sa propre requête, faite par le navigateur, sans passer par `HttpClient`. Or les intercepteurs Angular ne voient que les requêtes émises par `HttpClient`, et un élément média ne permet pas d'ajouter un en-tête personnalisé. La requête partirait donc sans jeton et recevrait un `401`. C'est pourquoi l'application télécharge le fichier avec `HttpClient` (l'intercepteur ajoute le jeton) puis fait lire au lecteur une adresse locale `blob:`.

## Les contrôles déjà présents côté backend

| Contrôle | Emplacement |
|---|---|
| Un fichier est présent (sinon `400` « Fichier audio requis ») | `app.js:340-343` |
| Le champ `title` est lu, avec repli sur le nom du fichier | `app.js:347` |
| Types acceptés : `audio/mpeg`, `audio/wav`, `audio/x-wav`, `audio/ogg`, `audio/mp4`, `audio/x-m4a` | liste `app.js:34-41`, appliquée par `fileFilter` (`app.js:109-119`) |
| Taille maximale de 25 Mo, refusée avant l'écriture sur le disque | `app.js:31` et `app.js:108` |

Le frontend construit bien le `FormData` avec exactement `audio` et `title` (`track.service.ts:19-20`).

**Pourquoi doubler ces contrôles côté frontend ?** Pour l'expérience : l'utilisateur est prévenu immédiatement, sans envoyer 25 Mo pour rien. Mais la validation frontend ne remplace jamais celle du backend : n'importe qui peut appeler l'API sans passer par notre interface (par exemple avec `curl`), donc le backend doit toujours revérifier.

## Ce qui reste à compléter côté frontend

- Contrôler le type et la taille du fichier **avant** l'appel HTTP, avec un message clair (aujourd'hui seul `accept="audio/*"` guide le choix).
- Pendant l'envoi : état de chargement, bouton désactivé, pas de double soumission, erreurs du serveur affichées, message de succès, formulaire vidé et première page rechargée (aujourd'hui les erreurs n'apparaissent que dans la console, `tracks-page.ts:63`).
- Présenter les pistes sous forme de cards responsives et accessibles, avec une taille lisible (aujourd'hui `tracks-page.html:28` affiche l'octet brut suivi de « Ko »).
- Lecture : afficher le morceau en cours, un message d'erreur audio compréhensible, et révoquer l'`ObjectURL` finale à la destruction du composant (aujourd'hui seule l'URL précédente est révoquée).
- Mission 2 : un Signal d'erreur pour la liste.

## Questions sur la mémoire, le buffering et le streaming

**Le backend envoie-t-il le fichier entier en mémoire ou progressivement depuis le disque ?**
Progressivement depuis le disque. La route audio utilise `res.sendFile(audioPath, ...)` (`app.js:394`), qui lit le fichier en flux (stream) et le transmet par morceaux, sans le charger entièrement en mémoire. À l'envoi, Multer utilise `diskStorage` (`app.js:88`) : le fichier est écrit sur le disque au fur et à mesure de sa réception.

**Avec `HttpClient` et `responseType: "blob"`, à quel moment le composant reçoit-il le fichier ?**
Une seule fois, quand la réponse a été entièrement téléchargée : le callback `next` reçoit alors le `Blob` complet (`tracks-page.ts:69`). Tant que le téléchargement n'est pas terminé, le composant n'a rien à lire.

**Avec 100 morceaux, les 100 fichiers audio sont-ils chargés en mémoire dès l'affichage de la liste ?**
Non. `GET /api/tracks` ne renvoie que des métadonnées (titre, nom d'origine, type, taille, date), sans les octets audio, et par pages de 5 par défaut (`app.js:273-274`). Le fichier n'est téléchargé que lorsqu'on clique sur ▶ (`play()`, `tracks-page.ts:67-68`), un seul à la fois, et l'`ObjectURL` précédente est révoquée avant d'en créer une nouvelle (`tracks-page.ts:71-73`).

**Quelle différence avec 100 éléments `<audio>` utilisant directement une URL HTTP ?**
Le navigateur déciderait lui-même de précharger, selon l'attribut `preload` : jusqu'à 100 requêtes en parallèle, avec un buffering progressif et des requêtes partielles (`Range`), donc une lecture qui peut démarrer avant la fin du téléchargement. Mais ces requêtes n'auraient pas d'en-tête `Authorization`, ce qui obligerait à un autre mécanisme d'authentification (cookie, jeton dans l'URL). Notre approche télécharge le fichier complet avant la lecture, mais garde l'authentification par `HttpClient`.

**Pourquoi l'URL créée par `URL.createObjectURL` doit-elle être révoquée ?**
Tant qu'elle n'est pas révoquée (ou que la page n'est pas fermée), le navigateur garde le `Blob` en mémoire pour pouvoir répondre à cette adresse. Sans `revokeObjectURL`, chaque morceau joué reste en mémoire : c'est une fuite.

### Trois notions à ne pas confondre

- **Téléchargement complet d'un `Blob`** : le composant attend d'avoir tout le fichier avant de le lire.
- **Buffering du navigateur** : le lecteur charge à l'avance une partie du média pour éviter les coupures.
- **Streaming côté serveur** : le serveur lit et envoie le fichier par morceaux depuis le disque, sans le charger entièrement en mémoire.
