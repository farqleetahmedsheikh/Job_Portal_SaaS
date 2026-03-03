import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/user.module';

@Module({
  imports: [
    /* ENV CONFIG */
    ConfigModule.forRoot({
      isGlobal: true,
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
  ],
})
export class AppModule {}
