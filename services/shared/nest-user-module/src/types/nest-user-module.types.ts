export const NEST_USER_MODULE_OPTIONS = Symbol('NEST_USER_MODULE_OPTIONS');
export const AUTHENTICATION_SERVICE = Symbol('AUTHENTICATION_SERVICE');
export const AUTHORIZATION_SERVICE = Symbol('AUTHORIZATION_SERVICE');

export interface NestUserModuleOptions {
  keycloakBaseUrl: string;
  realm: string;
  clientId: string;
  clientSecret?: string;
  adminUsername?: string;
  introspectionTtlSeconds?: number;
}
