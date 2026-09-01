"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.KeycloakAuthenticationService = void 0;
const common_1 = require("@nestjs/common");
const nest_user_module_types_1 = require("../types/nest-user-module.types");
let KeycloakAuthenticationService = class KeycloakAuthenticationService {
    constructor(options) {
        this.options = options;
        this.introspectionCache = new Map();
    }
    extractToken(input) {
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
    async authenticate(token, options = {}) {
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
    decodeJwtPayload(token) {
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
            return parsed;
        }
        catch {
            return null;
        }
    }
    readUsername(payload) {
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
    readRoles(payload) {
        const roles = new Set();
        const realmAccess = payload.realm_access;
        if (realmAccess && typeof realmAccess === 'object') {
            const realmRoles = realmAccess.roles;
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
            for (const clientAccess of Object.values(resourceAccess)) {
                if (!clientAccess || typeof clientAccess !== 'object') {
                    continue;
                }
                const clientRoles = clientAccess.roles;
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
    readGroups(payload) {
        const groups = payload.groups;
        if (!Array.isArray(groups)) {
            return [];
        }
        return groups.filter((entry) => typeof entry === 'string');
    }
    async introspectToken(token) {
        const cached = this.introspectionCache.get(token);
        if (cached && cached.expiresAt > Date.now()) {
            return cached.result;
        }
        const response = await fetch(`${this.options.keycloakBaseUrl}/realms/${this.options.realm}/protocol/openid-connect/token/introspect`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                token,
                client_id: this.options.clientId,
                client_secret: this.options.clientSecret ?? '',
            }),
        });
        if (!response.ok) {
            return { active: false };
        }
        const result = (await response.json());
        const ttlSeconds = this.options.introspectionTtlSeconds ?? 30;
        this.introspectionCache.set(token, {
            expiresAt: Date.now() + ttlSeconds * 1000,
            result,
        });
        return result;
    }
};
exports.KeycloakAuthenticationService = KeycloakAuthenticationService;
exports.KeycloakAuthenticationService = KeycloakAuthenticationService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(nest_user_module_types_1.NEST_USER_MODULE_OPTIONS)),
    __metadata("design:paramtypes", [Object])
], KeycloakAuthenticationService);
//# sourceMappingURL=keycloak-authentication.service.js.map