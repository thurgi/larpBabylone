# LarpBabylone

Application collaborative d'édition de documents avec gestion de versions et de droits par groupes.

## Stack technique

| Service | Technologie | Port |
|---------|------------|------|
| **Backend** | NestJS (TypeScript) | 3001 |
| **Frontend** | Angular (shell) | 3000 |
| **Stockage** | Fichier plat (JSON + Markdown) | — |
| **Auth** | Keycloak (OIDC) | — |

## Structure du projet

```
larpBabylone/
├── services/
│   ├── objects/               # API NestJS
│   └── shared/
│       ├── user-module/       # Contrats users/roles/permissions
│       └── nest-user-module/  # Impl NestJS Keycloak
├── front/
│   ├── shell/                 # Shell Angular de connexion Keycloak
│   └── shared/
│       └── angular-user-module/ # Impl Angular Keycloak
├── data/                  # Stockage fichier plat (gitignored)
├── automation/ # stockage des fichiers pour le developpement local et la ci/cd
│   ├── docker-compose.yml
|   └── Autres ...
├── specifications/
│   └── generalite.md
├── docker-compose.yml
├── Makefile
├── openapi.yml            # Contrat d'interface OpenAPI
├── .env.example
└── .env                   # Variables locales (gitignored)
```

## Prérequis

- Docker et Docker Compose
- Make

## Installation

```bash
# Copier le fichier d'environnement et renseigner les variables
cp .env.example .env

# Installer les dépendances
make install
```

## Utilisation

```bash
make install    # Installer les dépendances
make build      # Build de production
make start      # Démarrer les services
make stop       # Arrêter les services
make restart    # Redémarrer
make logs       # Afficher les logs
make test       # Lancer tous les tests
make lint-api   # Valider le contrat OpenAPI
make help       # Liste des commandes
```

## Contrat d'interface

Le fichier `openapi.yml` à la racine définit l'ensemble des endpoints REST de l'API. Il peut être visualisé avec [Swagger Editor](https://editor.swagger.io/) ou validé avec `make lint-api`.

## Authentification

Le shell frontend gère le flux SSO Keycloak.  
Les services backend ne redirigent pas vers Keycloak : ils valident le token et renvoient `401/403` selon le cas.  
Le username défini dans `ADMIN_USERNAME` conserve un bypass super-admin.

## Permissions

- Un document sans groupe associé est accessible à tous.
- Un document avec un ou plusieurs groupes restreint les actions CRUD aux membres de ces groupes.
- Chaque groupe définit des permissions granulaires (CRUD) sur les documents et les versions.