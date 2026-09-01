import { AngularUserModuleOptions } from '@larpbabylone/angular-user-module';

declare global {
  interface Window {
    __env?: Record<string, string | undefined>;
  }
}

function readEnv(name: string, fallback: string): string {
  const value = window.__env?.[name];
  return value && value.length > 0 ? value : fallback;
}

export function getAngularUserModuleOptions(): AngularUserModuleOptions {
  const redirectUri = readEnv('SHELL_REDIRECT_URI', window.location.origin);

  return {
    keycloakBaseUrl: readEnv('SHELL_KEYCLOAK_BASE_URL', 'http://localhost:15010'),
    realm: readEnv('SHELL_KEYCLOAK_REALM', 'master'),
    clientId: readEnv('SHELL_KEYCLOAK_CLIENT_ID', 'larpbabylone'),
    redirectUri,
    postLogoutRedirectUri: readEnv('SHELL_POST_LOGOUT_REDIRECT_URI', redirectUri),
    tokenStorageKey: 'larpbabylone.shell.keycloak.token',
  };
}
