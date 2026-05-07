/* eslint-disable @typescript-eslint/no-unsafe-call */
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { IoAdapter } from '@nestjs/platform-socket.io';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useWebSocketAdapter(new IoAdapter(app));

  const config = app.get(ConfigService);
  const port = config.get<number>('app.port') ?? 9000;
  const origin = config.get<string[]>('app.frontendUrls') ?? [
    config.get<string>('app.frontendUrl') ?? 'http://localhost:3000',
  ];
  const isProd = config.get<string>('app.env') === 'production';

  // ── Security headers ────────────────────────────────
  app.use(helmet());

  // ── Cookie parser — must be before CORS and routes ──
  app.use(cookieParser());

  // ── CORS — credentials require exact origin, never * ─
  app.enableCors({
    origin: (
      requestOrigin: string | undefined,
      callback: (err: Error | null, allow?: boolean) => void,
    ) => {
      if (!requestOrigin || origin.includes(requestOrigin)) {
        callback(null, true);
        return;
      }
      callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Accept', 'Authorization'],
  });

  // ── Global prefix ────────────────────────────────────
  app.setGlobalPrefix('api');

  // ── Global validation pipe ───────────────────────────
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // strips fields not in DTO
      forbidNonWhitelisted: true, // throws if extra fields sent
      transform: true, // auto-transforms to DTO types
      transformOptions: {
        enableImplicitConversion: true, // converts "2" → 2 for @IsNumber()
      },
    }),
  );

  await app.listen(port);

  if (!isProd) {
    console.log(`🚀 API running at http://localhost:${port}/api`);
  }
}

void bootstrap();
