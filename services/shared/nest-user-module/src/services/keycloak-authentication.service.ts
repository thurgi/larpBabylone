import { Inject, Injectable } from '@nestjs/common';
import { AuthenticatedUser, AuthenticationCheckOptions, AuthenticationService } from '@larpbabylone/user-module';
import { NEST_USER_MODULE_OPTIONS, NestUserModuleOptions } from '../types/nest-user-module.types';

interface IntrospectionResult {
  active: boolean;
  [key: string]: unknown;
}

interface CacheEntry {
  expiresAt: number;
  result: IntrospectionResult;
}

@Injectable()
export class KeycloakAuthenticationService implements AuthenticationService {
  private readonly introspectionCache = new Map<string, CacheEntry>();

  constructor(
    @Inject(NEST_USER_MODULE_OPTIONS) private readonly options: NestUserModuleOptions,
  ) {}

  extractToken(input: { headers?: Record<string, unknown>; cookies?: Record<string, unknown> }): string | null {
    const authorization = input.headers?.authorization;
    if (typeof authorization === 'string' && authorization.startsWith('Bearer ')) {
      return authorization.slice('Bearer '.length).trim();
    }

    const cookieToken = input.cookies?.jwt;
    if (typeof cookieToken === 'string' && cookieToken.length > 0) {
      return cookieToken;
    }

    return null;
  }

  async authenticate(token: string, options: AuthenticationCheckOptions = {}): Promise<AuthenticatedUser | null> {
    const payload = this.decodeJwtPayload(token);
    if (!payload || typeof payload.sub !== 'string') {
      return null;
    }

    const shouldCheckActive = options.requireActive !== false && Boolean(this.options.clientSecret);
    if (shouldCheckActive) {
      const introspection = await this.introspectToken(token);
      if (!introspection.active) {
        return null;
      }
    }

    const username = this.readUsername(payload);
    if (!username) {
      return null;
    }

    return {
      id: payload.sub,
      username,
      email: typeof payload.email === 'string' ? payload.email : undefined,
      roles: this.readRoles(payload),
      groups: this.readGroups(payload),
      claims: payload,
    };
  }

  private decodeJwtPayload(token: string): Record<string, unknown> | null {
    const parts = token.split('.');
    if (parts.length < 2) {
      return null;
    }

    try {
      const json = Buffer.from(parts[1], 'base64url').toString('utf8');
      const parsed = JSON.parse(json);
      if (!parsed || typeof parsed !== 'object') {
        return null;
      }
      return parsed as Record<string, unknown>;
    } catch {
      return null;
    }
  }

  private readUsername(payload: Record<string, unknown>): string | null {
    const preferredUsername = payload.preferred_username;
    if (typeof preferredUsername === 'string' && preferredUsername.length > 0) {
      return preferredUsername;
    }

    const username = payload.username;
    if (typeof username === 'string' && username.length > 0) {
      return username;
    }

    return null;
  }

  private readRoles(payload: Record<string, unknown>): string[] {
    const roles = new Set<string>();

    const realmAccess = payload.realm_access;
    if (realmAccess && typeof realmAccess === 'object') {
      const realmRoles = (realmAccess as { roles?: unknown }).roles;
      if (Array.isArray(realmRoles)) {
        for (const role of realmRoles) {
          if (typeof role === 'string' && role.length > 0) {
            roles.add(role);
          }
        }
      }
    }

    const resourceAccess = payload.resource_access;
    if (resourceAccess && typeof resourceAccess === 'object') {
      for (const clientAccess of Object.values(resourceAccess as Record<string, unknown>)) {
        if (!clientAccess || typeof clientAccess !== 'object') {
          continue;
        }
        const clientRoles = (clientAccess as { roles?: unknown }).roles;
        if (Array.isArray(clientRoles)) {
          for (const role of clientRoles) {
            if (typeof role === 'string' && role.length > 0) {
              roles.add(role);
            }
          }
        }
      }
    }

    return [...roles];
  }

  private readGroups(payload: Record<string, unknown>): string[] {
    const groups = payload.groups;
    if (!Array.isArray(groups)) {
      return [];
    }

    return groups.filter((entry): entry is string => typeof entry === 'string');
  }

  private async introspectToken(token: string): Promise<IntrospectionResult> {
    const cached = this.introspectionCache.get(token);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.result;
    }

    const response = await fetch(
      `${this.options.keycloakBaseUrl}/realms/${this.options.realm}/protocol/openid-connect/token/introspect`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          token,
          client_id: this.options.clientId,
          client_secret: this.options.clientSecret ?? '',
        }),
      },
    );

    if (!response.ok) {
      return { active: false };
    }

    const result = (await response.json()) as IntrospectionResult;
    const ttlSeconds = this.options.introspectionTtlSeconds ?? 30;
    this.introspectionCache.set(token, {
      expiresAt: Date.now() + ttlSeconds * 1000,
      result,
    });

    return result;
  }
}
