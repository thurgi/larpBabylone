import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './jwt.strategy';
import { GoogleStrategy } from './google.strategy';
import { DiscordStrategy } from './discord.strategy';
import { UserEntity } from './entities/user.entity';
import { GroupEntity } from '../groups/entities/group.entity';

@Module({
  imports: [
    PassportModule,
    JwtModule.registerAsync({
      useFactory: () => ({
        secret: process.env.JWT_SECRET || 'test-secret',
        signOptions: { expiresIn: '24h' },
      }),
    }),
    TypeOrmModule.forFeature([UserEntity, GroupEntity]),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, GoogleStrategy, DiscordStrategy],
  exports: [AuthService, JwtModule],
})
export class AuthModule {}
