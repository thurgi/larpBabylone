// Example: Intégration du UserModule dans un service
// src/app.module.ts

import { Module } from '@nestjs/common';
import { UserModule } from '@larpbabylone/user-module';
import { MyAuthGuard } from './guards/my-auth.guard';
import { MyService } from './services/my.service';

@Module({
  imports: [
    UserModule.register({
      authServiceUrl: process.env.AUTH_SERVICE_URL ?? 'http://localhost:3001',
      groupsServiceUrl: process.env.BACKEND_URL ?? 'http://localhost:3000',
    }),
  ],
  providers: [MyAuthGuard, MyService],
})
export class AppModule {}
