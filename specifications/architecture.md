# Architecture

## infrastructure

Le projet est conteneurisé avec Docker et orchestré avec Docker Compose. Il est possible de lancer l'ensemble des services avec la commande `make start` ou `docker-compose up`.
il dispose de plusieurs services :
- **auth** : service d'authentification centralisé NestJS (SSO) — port 3002
- **objects** : l'API NestJS pour la gestion des objets (documents, versions, groupes, utilisateurs, etc.)
- **ihm** : l'interface utilisateur React + Vite
- **nginx** : le serveur web Nginx pour servir l'interface utilisateur, router les sous-domaines et faire du reverse proxy vers les API

## services

### auth (service central SSO)

Service NestJS indépendant hébergé sur `auth.<domaine>`.

**Rôle :**
- Point d'entrée unique pour l'authentification (Discord, Google OAuth2)
- Émission des JWT signés (secret partagé avec les backends des associations)
- Gestion du référentiel des utilisateurs globaux (SQLite centrale)
- CRUD des associations loi 1901 (réservé au super-admin)

**JWT émis :**
```json
{ "sub": "<userId>", "username": "...", "email": "...", "provider": "discord|google" }
```

**Endpoints principaux :**
- `GET /auth/discord` → login Discord
- `GET /auth/google` → login Google
- `GET /auth/me` → profil de l'utilisateur connecté
- `POST /auth/logout` → déconnexion (efface le cookie)
- `GET /auth/logout-redirect` → déconnexion globale avec redirection
- `GET /associations` → liste des associations (public)
- `POST /associations` → créer une association (super-admin)
- `PUT /associations/:id` → modifier une association (super-admin)
- `DELETE /associations/:id` → supprimer une association (super-admin)

### backends des associations

Chaque association tourne sur son sous-domaine (`<slug>.<domaine>`).
Le backend **valide le JWT** émis par le service auth central (même `JWT_SECRET`).
À la première connexion d'un utilisateur sur une instance, son profil est automatiquement enregistré localement.
Les droits (groupes, permissions) sont gérés localement dans la SQLite de l'instance.

## Cookie cross-subdomain

Le cookie JWT est émis avec `domain=.<domaine>` pour être partagé entre tous les sous-domaines :
- Dev : `domain=localhost`
- Prod : `domain=.mondomaine.fr`

## Routing nginx (développement)

| Host | Destination |
|---|---|
| `auth.localhost` | auth:3002 |
| `<slug>.localhost` | backend:3001 (header `X-Tenant: <slug>`) + frontend:3000 |
| `localhost` | backend:3001 + frontend:3000 (fallback) |

## Flux d'authentification

```
1. Utilisateur sur babylone.localhost → clique "Se connecter"
2. Frontend redirige vers auth.localhost/auth/discord?returnTo=http://babylone.localhost
3. Keycloak OAuth2 Discord → auth-service crée/retrouve l'utilisateur
4. auth-service émet JWT, pose le cookie (domain=localhost), redirige vers returnTo
5. Frontend sur babylone.localhost détecte le cookie → appelle /api/auth/me
6. Backend valide le JWT, auto-enregistre l'utilisateur localement, retourne le profil
```

