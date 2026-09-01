import { Inject, Injectable } from '@angular/core';
import { AuthenticatedUser, AuthenticationCheckOptions, AuthenticationService } from '@larpbabylone/user-module';
import { AngularUserModuleOptions } from '../types/angular-user-module.types';
import { ANGULAR_USER_MODULE_OPTIONS } from '../types/angular-user-module.tokens';

@Injectable()
export class AngularAuthenticationService implements AuthenticationService {
  constructor(
    @Inject(ANGULAR_USER_MODULE_OPTIONS)
    private readonly options: AngularUserModuleOptions,
  ) {}

  getStoredToken(): string | null {
    return localStorage.getItem(this.getTokenStorageKey());
  }

  saveToken(token: string): void {
    localStorage.setItem(this.getTokenStorageKey(), token);
  }

  clearToken(): void {
    localStorage.removeItem(this.getTokenStorageKey());
  }

  consumeCallbackFromUrlHash(): string | null {
    const hash = window.location.hash.startsWith('#')
      ? window.location.hash.slice(1)
      : window.location.hash;
    const params = new URLSearchParams(hash);
    const token = params.get('access_token');
    if (!token) {
      return null;
    }

    this.saveToken(token);
    window.history.replaceState({}, document.title, window.location.pathname);
    return token;
  }

  extractToken(input: { headers?: Record<string, unknown>; cookies?: Record<string, unknown> }): string | null {
    const authorization = input.headers?.['authorization'];
    if (typeof authorization === 'string' && authorization.startsWith('Bearer ')) {
      return authorization.slice('Bearer '.length).trim();
    }
    return null;
  }

  async authenticate(token: string, _options?: AuthenticationCheckOptions): Promise<AuthenticatedUser | null> {
    const payload = this.decodeJwtPayload(token);
    if (!payload || typeof payload['sub'] !== 'string' || typeof payload['preferred_username'] !== 'string') {
      return null;
    }

    return {
      id: payload['sub'],
      username: payload['preferred_username'],
      email: typeof payload['email'] === 'string' ? payload['email'] : undefined,
      roles: this.readRoles(payload),
      groups: this.readGroups(payload),
      claims: payload,
    };
  }

  buildLoginUrl(state?: string): string {
    const params = new URLSearchParams({
      client_id: this.options.clientId,
      response_type: 'token',
      scope: 'openid profile email',
      redirect_uri: this.options.redirectUri,
    });
    if (state) {
      params.set('state', state);
    }
    return `${this.options.keycloakBaseUrl}/realms/${this.options.realm}/protocol/openid-connect/auth?${params.toString()}`;
  }

  buildLogoutUrl(): string {
    const params = new URLSearchParams({
      client_id: this.options.clientId,
      post_logout_redirect_uri: this.options.postLogoutRedirectUri ?? this.options.redirectUri,
    });
    return `${this.options.keycloakBaseUrl}/realms/${this.options.realm}/protocol/openid-connect/logout?${params.toString()}`;
  }

  private decodeJwtPayload(token: string): Record<string, unknown> | null {
    const parts = token.split('.');
    if (parts.length < 2) {
      return null;
    }

    try {
      const json = atob(parts[1].replace(/-/g, '+').replace(/_/g, '/'));
      const parsed = JSON.parse(json);
      if (!parsed || typeof parsed !== 'object') {
        return null;
      }
      return parsed as Record<string, unknown>;
    } catch {
      return null;
    }
  }

  private readRoles(payload: Record<string, unknown>): string[] {
    const realmAccess = payload['realm_access'];
    if (!realmAccess || typeof realmAccess !== 'object') {
      return [];
    }
    const roles = (realmAccess as { roles?: unknown }).roles;
    if (!Array.isArray(roles)) {
      return [];
    }
    return roles.filter((role): role is string => typeof role === 'string');
  }

  private readGroups(payload: Record<string, unknown>): string[] {
    const groups = payload['groups'];
    if (!Array.isArray(groups)) {
      return [];
    }
    return groups.filter((group): group is string => typeof group === 'string');
  }

  private getTokenStorageKey(): string {
    return this.options.tokenStorageKey ?? 'larpbabylone.shell.keycloak.token';
  }
}
