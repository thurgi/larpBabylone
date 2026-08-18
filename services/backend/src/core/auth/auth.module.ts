import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './jwt.strategy';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    PassportModule,
    JwtModule.registerAsync({
      useFactory: () => ({
        secret: process.env.JWT_SECRET || 'test-secret',
        signOptions: { expiresIn: '24h' },
      }),
    }),
    UsersModule,
  ],
  controllers: [AuthController],
  providers: [JwtStrategy],
  exports: [UsersModule, JwtModule],
})
export class AuthModule {}
