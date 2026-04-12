import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/user.module';
import { ResumesModule } from './modules/resumes/resumes.module';
import { JobsModule } from './modules/jobs/jobs.module';
import { ApplicantProfilesModule } from './modules/applicants/applicants.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { MessagingModule } from './modules/messages/messages.module';
import { ApplicationsModule } from './modules/applications/applications.module';
import { CodingTestsModule } from './modules/coding-tests/coding-tests.module';
import { CompaniesModule } from './modules/companies/companies.module';
import { CloudinaryModule } from './modules/cloudinary/cloudinary.module';

import { validate } from './config/env.validations';
import databaseConfig from './config/database.config';
import appConfig from './config/app.config';
import mailConfig from './config/mail.config';
import redisConfig from './config/redis.config';
import { InterviewsModule } from './modules/interviews/interviews.module';
import { BillingModule } from './modules/billing/billing.module';

@Module({
  imports: [
    // ── Config ─────────────────────────────────────────
    // validate() throws at startup if any required env var is missing
    // so you catch misconfiguration before the app ever accepts traffic
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true, // caches process.env — faster reads
      load: [databaseConfig, appConfig, mailConfig, redisConfig],
      validate, // zod/joi schema — see below
    }),

    // ── Database ────────────────────────────────────────
    // forRootAsync reads config after ConfigModule is ready
    // Never read process.env directly in module definitions
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get<string>('database.host'),
        port: config.get<number>('database.port'),
        username: config.get<string>('database.user'),
        password: config.get<string>('database.password'),
        database: config.get<string>('database.name'),
        autoLoadEntities: true,
        synchronize: config.get<string>('app.env') !== 'production',
        ssl:
          config.get<string>('app.env') === 'production'
            ? { rejectUnauthorized: true }
            : false,
        logging:
          config.get<string>('app.env') === 'development'
            ? ['error', 'warn']
            : ['error'],
        // Connection pool — prevents DB exhaustion under load
        extra: {
          max: 20, // max pool size
          idleTimeoutMillis: 30_000,
          connectionTimeoutMillis: 5_000,
        },
      }),
    }),

    // ── Rate limiting ───────────────────────────────────
    // Global default — individual routes override via @Throttle()
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => [
        {
          ttl: config.get<number>('app.throttleTtl') ?? 60_000,
          limit: config.get<number>('app.throttleLimit') ?? 60,
        },
      ],
    }),

    // ── Feature modules ─────────────────────────────────
    AuthModule,
    UsersModule,
    ResumesModule,
    ApplicationsModule,
    ApplicantProfilesModule,
    JobsModule,
    InterviewsModule,
    NotificationsModule,
    MessagingModule,
    CodingTestsModule,
    CompaniesModule,
    CloudinaryModule,
    BillingModule,
  ],

  providers: [
    // Applies ThrottlerGuard globally so every route is
    // rate-limited by default — no need to add it per controller
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
