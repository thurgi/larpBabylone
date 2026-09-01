import { AuthenticatedUser, AuthenticationCheckOptions, AuthenticationService } from "../../../user-module/src";
import { NestUserModuleOptions } from '../types/nest-user-module.types';
export declare class KeycloakAuthenticationService implements AuthenticationService {
    private readonly options;
    private readonly introspectionCache;
    constructor(options: NestUserModuleOptions);
    extractToken(input: {
        headers?: Record<string, unknown>;
        cookies?: Record<string, unknown>;
    }): string | null;
    authenticate(token: string, options?: AuthenticationCheckOptions): Promise<AuthenticatedUser | null>;
    private decodeJwtPayload;
    private readUsername;
    private readRoles;
    private readGroups;
    private introspectToken;
}
