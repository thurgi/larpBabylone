export const USER_MODULE_OPTIONS = Symbol('USER_MODULE_OPTIONS');

export interface UserModuleOptions {
  /** URL base du auth-service (ex: http://auth-service:3001) */
  authServiceUrl: string;
  /** URL base du service gérant les groupes (ex: http://backend:3000). Défaut: authServiceUrl */
  groupsServiceUrl?: string;
}
