# LarpBabylone

Application collaborative d'édition de documents avec gestion de versions et de droits par groupes.

## Stack technique

| Service | Technologie | Port |
|---------|------------|------|
| **Backend** | NestJS (TypeScript) | 3001 |
| **Frontend** | React + Vite + @gravity-ui/markdown-editor | 3000 |
| **Stockage** | Fichier plat (JSON + Markdown) | — |
| **Auth** | OAuth2 (Discord, Google) + JWT | — |

## Structure du projet

```
larpBabylone/
├── backend/ 
│   ├── backend/               # API NestJS
│   └── frontend/              # React + Vite
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
make start      # Démarrer les services
make stop       # Arrêter les services
make restart    # Redémarrer
make logs       # Afficher les logs
make test       # Lancer tous les tests
make build      # Build de production
make lint-api   # Valider le contrat OpenAPI
make help       # Liste des commandes
```

## Contrat d'interface

Le fichier `openapi.yml` à la racine définit l'ensemble des endpoints REST de l'API. Il peut être visualisé avec [Swagger Editor](https://editor.swagger.io/) ou validé avec `make lint-api`.

## Authentification

Les utilisateurs se connectent via OAuth2 Discord ou Google. Un JWT est retourné après authentification.  
Le username défini dans la variable `ADMIN_USERNAME` dispose de tous les droits (super-admin).

## Permissions

- Un document sans groupe associé est accessible à tous.
- Un document avec un ou plusieurs groupes restreint les actions CRUD aux membres de ces groupes.
- Chaque groupe définit des permissions granulaires (CRUD) sur les documents et les versions.