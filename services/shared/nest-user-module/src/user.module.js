"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var NestUserModule_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.NestUserModule = void 0;
const common_1 = require("@nestjs/common");
const nest_user_module_types_1 = require("./types/nest-user-module.types");
const keycloak_authentication_service_1 = require("./services/keycloak-authentication.service");
const keycloak_authorization_service_1 = require("./services/keycloak-authorization.service");
const keycloak_jwt_auth_guard_1 = require("./guards/keycloak-jwt-auth.guard");
let NestUserModule = NestUserModule_1 = class NestUserModule {
    static register(options) {
        return {
            module: NestUserModule_1,
            providers: [
                { provide: nest_user_module_types_1.NEST_USER_MODULE_OPTIONS, useValue: options },
                keycloak_authentication_service_1.KeycloakAuthenticationService,
                keycloak_authorization_service_1.KeycloakAuthorizationService,
                { provide: nest_user_module_types_1.AUTHENTICATION_SERVICE, useExisting: keycloak_authentication_service_1.KeycloakAuthenticationService },
                { provide: nest_user_module_types_1.AUTHORIZATION_SERVICE, useExisting: keycloak_authorization_service_1.KeycloakAuthorizationService },
                keycloak_jwt_auth_guard_1.KeycloakJwtAuthGuard,
                keycloak_jwt_auth_guard_1.OptionalKeycloakJwtAuthGuard,
            ],
            exports: [
                nest_user_module_types_1.AUTHENTICATION_SERVICE,
                nest_user_module_types_1.AUTHORIZATION_SERVICE,
                keycloak_jwt_auth_guard_1.KeycloakJwtAuthGuard,
                keycloak_jwt_auth_guard_1.OptionalKeycloakJwtAuthGuard,
            ],
        };
    }
};
exports.NestUserModule = NestUserModule;
exports.NestUserModule = NestUserModule = NestUserModule_1 = __decorate([
    (0, common_1.Module)({})
], NestUserModule);
//# sourceMappingURL=user.module.js.map