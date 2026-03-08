import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { JwtStrategy } from './strategies/jwt.strategy';
import { AuthService } from './auth.service';
import { UsersModule } from '../users/user.module';
import { AuthController } from './auth.controller';
import { ApplicantProfilesModule } from '../applicants/applicants.module';
import { CompaniesModule } from '../companies/companies.module';
import { MailModule } from '../mail/mail.module';
import { CacheModule } from '../cache/cache.modules';

@Module({
  imports: [
    UsersModule,
    ApplicantProfilesModule,
    CompaniesModule,
    MailModule,
    CacheModule,
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
