export declare const NEST_USER_MODULE_OPTIONS: unique symbol;
export declare const AUTHENTICATION_SERVICE: unique symbol;
export declare const AUTHORIZATION_SERVICE: unique symbol;
export interface NestUserModuleOptions {
    keycloakBaseUrl: string;
    realm: string;
    clientId: string;
    clientSecret?: string;
    adminUsername?: string;
    introspectionTtlSeconds?: number;
}
