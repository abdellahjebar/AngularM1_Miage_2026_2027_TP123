# TP1 — Flux d'un clic sur « Se connecter »

Chemin complet, du clic à la redirection. Chaque étape est numérotée et référence le fichier et la ligne concernés.

```mermaid
sequenceDiagram
    autonumber
    actor U as Utilisateur
    participant LP as LoginPage (login-page.ts)
    participant AS as AuthService (auth.service.ts)
    participant IN as authInterceptor
    participant PX as Serveur Angular :4200 (proxy)
    participant EX as Express :3000 (app.js)
    participant UM as User (User.js)
    participant DB as MongoDB Atlas

    U->>LP: clic sur Se connecter (login-page.html:3, ngSubmit)
    LP->>AS: submit() appelle auth.login(email, password) (login-page.ts:27-29)
    AS->>IN: http.post('/api/auth/login', {email, password}) (auth.service.ts:15-17)
    Note over IN: auth.interceptor.ts:6-16<br/>ajoute Authorization: Bearer si token() existe.<br/>Premier login : pas de jeton.<br/>Observé : un jeton déjà stocké est aussi envoyé (aucun filtre sur l'URL).
    IN->>PX: POST /api/auth/login
    PX->>EX: redirigé vers http://localhost:3000 (proxy.conf.json)
    Note over EX: app.js:132 journalisation, :145 cors(), :150 express.json()<br/>puis la route (:195). Pas de middleware auth sur cette route.
    EX->>UM: User.findOne({ email }).select("+passwordHash") (app.js:207)
    UM->>DB: requête sur la collection users
    DB-->>UM: document utilisateur
    EX->>UM: user.verifyPassword(password), bcrypt.compare (app.js:209, User.js:46-49)
    alt identifiants incorrects
        EX-->>LP: 401 {message: "Identifiants incorrects"} (app.js:211)
        Note over LP: login-page.ts:34-37<br/>affiche le message dans le Signal error
    else identifiants corrects
        Note over EX: app.js:215 token(user) : JWT {sub, email}, expire en 2 h (app.js:48-53)
        EX-->>AS: 200 {token, user: toPublic()} (User.js:52-59, sans passwordHash)
        Note over AS: tap() puis storeAuthentication (auth.service.ts:18, :45-49)<br/>localStorage 'gpc_token', Signals token et currentUser
        AS-->>LP: next (login-page.ts:30)
        LP->>LP: router.navigateByUrl('/tracks') (login-page.ts:32)
        Note over LP: routes.ts:13 canActivate: authGuard<br/>auth.guard.ts:10 : token() ? true : redirection /login
    end
```

## Après la connexion : requêtes protégées

Pour toute requête suivante (par exemple `GET /api/tracks`), `authInterceptor` ajoute `Authorization: Bearer <jeton>`. Côté serveur, le middleware `auth` (`app.js:56-77`) vérifie la signature et la date avec `jwt.verify`, place le contenu du jeton dans `req.auth`, puis la route filtre les données par `req.auth.sub` (`app.js:275`).

## Observations dans les DevTools (onglet Network)

- La requête part vers `localhost:4200/api/auth/login` (port du serveur Angular), pas vers `:3000` : c'est le proxy qui la transmet au backend.
- Connexion réussie : statut `200`, corps de réponse `{token, user}`.
- Connexion refusée (mauvais mot de passe) : statut `401`, corps `{"message":"Identifiants incorrects"}`.
- Lorsqu'un jeton était déjà enregistré, l'en-tête `Authorization` était présent sur la requête de connexion elle-même ; le backend l'ignore, cette route n'exigeant pas de jeton.
