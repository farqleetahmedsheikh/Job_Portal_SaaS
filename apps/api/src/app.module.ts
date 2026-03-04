import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/user.module';
import { ResumesModule } from './modules/resumes/resumes.module';
import { JobsModule } from './modules/jobs/jobs.module';
import { ApplicantsModule } from './modules/applicants/applicants.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { MessagesModule } from './modules/messages/messages.module';
import { ApplicationsModule } from './modules/applications/applications.module';
import { CodingTestsModule } from './modules/coding-tests/coding-tests.module';
import { CompaniesModule } from './modules/companies/companies.module';

@Module({
  imports: [
    /* ENV CONFIG */
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '../.env',
    }),

    /* DATABASE */
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT),
      username: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      autoLoadEntities: true,
      synchronize: false, // NEVER true in prod
    }),

    /* FEATURE MODULES */
    AuthModule,
    UsersModule,
    ResumesModule,
    ApplicationsModule,
    ApplicantsModule,
    JobsModule,
    NotificationsModule,
    MessagesModule,
    CodingTestsModule,
    CompaniesModule,
  ],
})
export class AppModule {}
