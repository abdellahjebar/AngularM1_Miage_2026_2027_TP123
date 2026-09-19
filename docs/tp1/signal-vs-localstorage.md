# TP1 — Signal ou `localStorage` ?

## La différence

| | Signal | `localStorage` |
|---|---|---|
| Où vit la valeur | en mémoire, dans l'application Angular | dans le navigateur, sur le disque |
| Réactivité | oui : tout ce qui lit le Signal (template, `computed`, guard, intercepteur) est mis à jour quand il change | non : Angular ne sait pas qu'il a changé, il faut relire la valeur à la main |
| Après un rechargement de la page | **perdu** | **conservé** |
| Type de valeur | n'importe quel type | des chaînes de caractères uniquement |
| Accès | uniquement par le code de l'application | par tout script de la même origine (onglets, extensions, code injecté) |

## Comment le projet les combine

Les deux se complètent, dans `shared/services/auth.service.ts` :

- `token` est un **Signal initialisé depuis `localStorage`** (ligne 13) : au démarrage de l'application, une session existante est retrouvée ;
- à la connexion, `storeAuthentication` écrit dans **les deux** (lignes 46 à 50) : `localStorage` garde le jeton après un rechargement, le Signal fait réagir l'interface immédiatement ;
- à la déconnexion, `logout` efface **les deux** (lignes 40 à 44) ;
- `isLoggedIn` est un `computed` construit sur le Signal `token` (ligne 14) : la navigation, le guard et l'intercepteur réagissent seuls.

Le Signal apporte la **réactivité**, `localStorage` apporte la **persistance**.

`currentUser`, lui, n'est qu'un Signal : il est perdu au rechargement. C'est pourquoi la page profil relit `/api/users/me` à chaque ouverture (`profile-page.ts:32-33`) au lieu de compter sur une valeur conservée.

## La limite à connaître

Tout script de la page peut lire `localStorage` : une faille XSS pourrait voler le jeton. Un cookie `httpOnly` l'éviterait, mais introduit d'autres risques (CSRF) et une autre architecture. Ici le choix reste raisonnable : jeton court (2 heures) et projet pédagogique.
