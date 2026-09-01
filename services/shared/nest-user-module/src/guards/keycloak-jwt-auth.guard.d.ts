import { CanActivate, ExecutionContext } from '@nestjs/common';
import { AuthenticationService } from "../../../user-module/src";
export declare class KeycloakJwtAuthGuard implements CanActivate {
    private readonly authenticationService;
    constructor(authenticationService: AuthenticationService);
    canActivate(context: ExecutionContext): Promise<boolean>;
}
export declare class OptionalKeycloakJwtAuthGuard implements CanActivate {
    private readonly authenticationService;
    constructor(authenticationService: AuthenticationService);
    canActivate(context: ExecutionContext): Promise<boolean>;
}
