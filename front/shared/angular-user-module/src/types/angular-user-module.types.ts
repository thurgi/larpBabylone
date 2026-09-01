export interface AngularUserModuleOptions {
  keycloakBaseUrl: string;
  realm: string;
  clientId: string;
  redirectUri: string;
  postLogoutRedirectUri?: string;
  tokenStorageKey?: string;
}
