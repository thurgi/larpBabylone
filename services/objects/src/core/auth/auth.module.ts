import { Module } from '@nestjs/common';
import { NestUserModule } from '@larpbabylone/nest-user-module';
import { AuthController } from './auth.controller';

@Module({
  imports: [
    NestUserModule.register({
      keycloakBaseUrl: process.env.KEYCLOAK_BASE_URL || 'http://localhost:15010',
      realm: process.env.KEYCLOAK_REALM || 'master',
      clientId: process.env.KEYCLOAK_CLIENT_ID || 'larpbabylone',
      clientSecret: process.env.KEYCLOAK_CLIENT_SECRET,
      adminUsername: process.env.ADMIN_USERNAME,
      introspectionTtlSeconds: Number(process.env.KEYCLOAK_INTROSPECTION_TTL_SECONDS || 30),
    }),
  ],
  controllers: [AuthController],
  exports: [NestUserModule],
})
export class AuthModule {}
