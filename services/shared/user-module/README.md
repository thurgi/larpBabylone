# user-module

Module de **contrats partagés uniquement**.

Il contient:
- les types utilisateurs/groupes/permissions;
- les interfaces d'abstraction `AuthenticationService` et `AuthorizationService`;
- les utilitaires d'autorisation communs.

Il ne contient plus d'implémentation réseau ni de module NestJS.

## Implémentations associées

- `services/shared/nest-user-module`: implémentation backend NestJS basée sur Keycloak.
- `front/shared/angular-user-module`: implémentation frontend Angular pour le SSO Keycloak.
