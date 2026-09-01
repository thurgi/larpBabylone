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
exports.OptionalKeycloakJwtAuthGuard = exports.KeycloakJwtAuthGuard = void 0;
const common_1 = require("@nestjs/common");
const nest_user_module_types_1 = require("../types/nest-user-module.types");
let KeycloakJwtAuthGuard = class KeycloakJwtAuthGuard {
    constructor(authenticationService) {
        this.authenticationService = authenticationService;
    }
    async canActivate(context) {
        const request = context.switchToHttp().getRequest();
        const token = this.authenticationService.extractToken(request);
        if (!token) {
            throw new common_1.UnauthorizedException();
        }
        const user = await this.authenticationService.authenticate(token);
        if (!user) {
            throw new common_1.UnauthorizedException();
        }
        request.user = user;
        return true;
    }
};
exports.KeycloakJwtAuthGuard = KeycloakJwtAuthGuard;
exports.KeycloakJwtAuthGuard = KeycloakJwtAuthGuard = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(nest_user_module_types_1.AUTHENTICATION_SERVICE)),
    __metadata("design:paramtypes", [Object])
], KeycloakJwtAuthGuard);
let OptionalKeycloakJwtAuthGuard = class OptionalKeycloakJwtAuthGuard {
    constructor(authenticationService) {
        this.authenticationService = authenticationService;
    }
    async canActivate(context) {
        const request = context.switchToHttp().getRequest();
        const token = this.authenticationService.extractToken(request);
        if (!token) {
            request.user = null;
            return true;
        }
        const user = await this.authenticationService.authenticate(token);
        request.user = user;
        return true;
    }
};
exports.OptionalKeycloakJwtAuthGuard = OptionalKeycloakJwtAuthGuard;
exports.OptionalKeycloakJwtAuthGuard = OptionalKeycloakJwtAuthGuard = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(nest_user_module_types_1.AUTHENTICATION_SERVICE)),
    __metadata("design:paramtypes", [Object])
], OptionalKeycloakJwtAuthGuard);
//# sourceMappingURL=keycloak-jwt-auth.guard.js.map