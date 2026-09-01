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
exports.KeycloakAuthorizationService = void 0;
const common_1 = require("@nestjs/common");
const nest_user_module_types_1 = require("../types/nest-user-module.types");
let KeycloakAuthorizationService = class KeycloakAuthorizationService {
    constructor(options) {
        this.options = options;
    }
    isSuperAdmin(user) {
        if (this.options.adminUsername && user.username === this.options.adminUsername) {
            return true;
        }
        return this.hasAnyRole(user, ['super-admin', 'admin']);
    }
    hasRole(user, role) {
        return user.roles.includes(role);
    }
    hasAnyRole(user, roles) {
        return roles.some((role) => this.hasRole(user, role));
    }
    hasGroup(user, group) {
        return user.groups.includes(group);
    }
    canAccessRequirement(user, requirement) {
        if (!user) {
            return false;
        }
        if (this.isSuperAdmin(user)) {
            return true;
        }
        const requiredRole = `${requirement.resource}:${requirement.action}`;
        return this.hasRole(user, requiredRole);
    }
};
exports.KeycloakAuthorizationService = KeycloakAuthorizationService;
exports.KeycloakAuthorizationService = KeycloakAuthorizationService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(nest_user_module_types_1.NEST_USER_MODULE_OPTIONS)),
    __metadata("design:paramtypes", [Object])
], KeycloakAuthorizationService);
//# sourceMappingURL=keycloak-authorization.service.js.map