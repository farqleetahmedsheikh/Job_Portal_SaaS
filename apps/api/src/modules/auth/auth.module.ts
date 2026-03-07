import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { JwtStrategy } from './strategies/jwt.strategy';
import { AuthService } from './auth.service';
import { UsersModule } from '../users/user.module';
import { AuthController } from './auth.controller';

@Module({
  imports: [
    UsersModule,
    PassportModule,
    ConfigModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get('JWT_SECRET') || 'my-secret',
        signOptions: {
          expiresIn: config.get('JWT_EXPIRES_IN') || '3600s',
        },
      }),
    }),
  ],
  controllers: [AuthController], // ✅ correct place
  providers: [AuthService, JwtStrategy],
})
export class AuthModule {}
