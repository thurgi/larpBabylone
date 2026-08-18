# User Module - Guide d'utilisation

## Présentation

Le `UserModule` est un module NestJS partagé qui fournit un service injectable pour :
- ✅ Identifier si un utilisateur est admin (super-admin)
- ✅ Récupérer les informations utilisateurs
- ✅ Récupérer les groupes et les permissions

Le module fonctionne en **architecture microservices** avec des appels HTTP vers le `auth-service`.

## Installation

Le module est déjà configuré dans `shared/user-module/` et compilé en tant que dépendance locale.

### Dépendances requises (déjà dans package.json)
```json
{
  "dependencies": {
    "@larpbabylone/user-module": "file:../shared/user-module",
    "@nestjs/common": "^11.1.0"
  },
  "devDependencies": {
    "@types/node": "^22.0.0"
  }
}
```

## Configuration

### 1. Importer le module dans votre app

```typescript
// src/app.module.ts
import { Module } from '@nestjs/common';
import { UserModule } from '@larpbabylone/user-module';

@Module({
  imports: [
    UserModule.register({
      authServiceUrl: process.env.AUTH_SERVICE_URL ?? 'http://localhost:3001',
      groupsServiceUrl: process.env.BACKEND_URL ?? 'http://localhost:3000',
    }),
  ],
})
export class AppModule {}
```

### 2. Variables d'environnement

```bash
# .env
AUTH_SERVICE_URL=http://auth-service:3001        # URL du service d'authentification
BACKEND_URL=http://backend:3000                   # URL du backend (service groupes)
ADMIN_USERNAME=admin@example.com                  # Username du super-admin
```

## Utilisation

### Injecter le service

```typescript
import { Injectable } from '@nestjs/common';
import { UsersService } from '@larpbabylone/user-module';

@Injectable()
export class MyService {
  constructor(private readonly usersService: UsersService) {}

  async checkAdminAccess(username: string): Promise<boolean> {
    return this.usersService.isAdmin(username);
  }

  async getUserInfo(userId: string) {
    return this.usersService.getProfile(userId);
  }

  async getAllUsers() {
    return this.usersService.findAllUsers();
  }

  async checkGroupAdmin(userId: string): Promise<boolean> {
    return this.usersService.isGroupAdmin(userId);
  }

  async listAllGroups() {
    return this.usersService.getAllGroupes();
  }
}
```

## API disponible

### `UsersService.isAdmin(username: string): boolean`
- **Synchrone** 
- Vérifie si l'utilisateur est super-admin via env var `ADMIN_USERNAME`
- Pas d'appel réseau (validation locale)

```typescript
if (this.usersService.isAdmin(user.username)) {
  // Accès total
}
```

### `UsersService.getProfile(userId: string): Promise<UserPayload | null>`
- Récupère le profil d'un utilisateur par ID
- Retourne `null` si l'utilisateur n'existe pas
- URL: `GET /users/:userId` sur auth-service

```typescript
const profile = await this.usersService.getProfile('user-123');
// { id, username, email, provider, providerId }
```

### `UsersService.findAllUsers(): Promise<UserPayload[]>`
- Liste tous les utilisateurs du système
- URL: `GET /users` sur auth-service

```typescript
const users = await this.usersService.findAllUsers();
users.forEach(u => console.log(u.username));
```

### `UsersService.getAllGroupes(): Promise<GroupMembership[]>`
- Liste tous les groupes avec permissions
- URL: `GET /groups` sur groupsServiceUrl (par défaut = authServiceUrl)

```typescript
const groups = await this.usersService.getAllGroupes();
// [{ id, name, userIds, permissions }]
```

### `UsersService.isGroupAdmin(userId: string): Promise<boolean>`
- Vérifie si l'utilisateur est admin d'au moins un groupe
- Récupère tous les groupes et vérifie les permissions

```typescript
const isGroupAdmin = await this.usersService.isGroupAdmin('user-123');
```

## Architecture microservices

```
┌─────────────────────────────────────────────────────────────┐
│                    Service consommateur                      │
│                  (ex: document-service)                      │
│                                                              │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  UsersService (injecté via UserModule.register)       │  │
│  │  - isAdmin(username)          → Env local             │  │
│  │  - getProfile(userId)         → HTTP GET /users/:id   │  │
│  │  - findAllUsers()             → HTTP GET /users       │  │
│  │  - getAllGroupes()            → HTTP GET /groups      │  │
│  │  - isGroupAdmin(userId)       → Combine avec groups   │  │
│  └───────────────────────────────────────────────────────┘  │
└────────┬───────────────────────┬──────────────────────────────┘
         │                       │
         │ HTTP                  │ HTTP
         ▼                       ▼
    ┌─────────────┐        ┌──────────────┐
    │  auth-service       │  backend      │
    │  (Users)    │        │  (Groups)    │
    │  /users     │        │  /groups     │
    └─────────────┘        └──────────────┘
```

## Endpoints du auth-service

Nouveaux endpoints internes exposés pour la consultation :

- **GET** `/users` — Liste tous les utilisateurs
- **GET** `/users/:id` — Récupère un utilisateur par ID

⚠️ **Sécurité** : À protéger via network policies en production (autorisés uniquement pour microservices internes).

## Migration de code existant

Si votre service utilisait directement une implémentation locale :

### Avant
```typescript
@Injectable()
export class MyService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly usersRepository: Repository<UserEntity>,
  ) {}

  async getUser(id: string) {
    return this.usersRepository.findOneBy({ id });
  }
}
```

### Après
```typescript
import { UsersService } from '@larpbabylone/user-module';

@Injectable()
export class MyService {
  constructor(private readonly usersService: UsersService) {}

  async getUser(id: string) {
    return this.usersService.getProfile(id);
  }
}
```

## Gestion d'erreurs

```typescript
try {
  const users = await this.usersService.findAllUsers();
} catch (error) {
  // Erreur réseau ou auth-service indisponible
  this.logger.error('Failed to fetch users', error);
  throw new Error('User service unavailable');
}
```

## Avantages de cette architecture

✅ **Centralisé** — Un seul auth-service pour tous les microservices
✅ **Découplé** — Chaque service est indépendant
✅ **Scalable** — Facile d'ajouter de nouveaux services
✅ **Testable** — Les appels HTTP peuvent être mockés en tests
✅ **Type-safe** — Interfaces TypeScript partagées

## Déploiement

```bash
# 1. Compiler le user-module
cd shared/user-module
npm install
npm run build

# 2. Compiler les services (le module est utilisé localement via file:../)
cd ../../auth-service
npm run build

cd ../../backend
npm run build

# 3. Configuration réseau
# Assurer que chaque service peut atteindre les autres via les URLs configurées
```

## Support et troubleshooting

### "Cannot find module '@larpbabylone/user-module'"
→ Compiler le user-module : `npm run build` dans `shared/user-module/`

### "Connection refused" en getProfile()
→ Vérifier `AUTH_SERVICE_URL` et que auth-service est disponible

### Appels réseau lents
→ Ajouter des timeouts, cacher les résultats, ou implémenter un circuit breaker

