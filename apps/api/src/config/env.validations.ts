/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import { plainToInstance } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsString,
  IsNotEmpty,
  IsOptional,
  Min,
  Max,
  MinLength,
  validateSync,
} from 'class-validator';

enum Environment {
  Development = 'development',
  Production = 'production',
  Test = 'test',
}

class EnvironmentVariables {
  // ── App ───────────────────────────────────────────────
  @IsEnum(Environment)
  NODE_ENV!: Environment;

  @IsInt()
  @Min(1)
  PORT!: number;

  @IsString()
  @IsNotEmpty()
  FRONTEND_URL!: string;

  // ── Database ──────────────────────────────────────────
  @IsString()
  @IsNotEmpty()
  DB_HOST!: string;

  @IsInt()
  @Min(1)
  DB_PORT!: number;

  @IsString()
  @IsNotEmpty()
  DB_USER!: string;

  @IsString()
  @IsNotEmpty()
  DB_PASSWORD!: string;

  @IsString()
  @IsNotEmpty()
  DB_NAME!: string;

  // ── Auth ──────────────────────────────────────────────
  @IsString()
  @MinLength(10) // enforce strong secret
  JWT_SECRET!: string;

  @IsString()
  @IsNotEmpty()
  JWT_EXPIRES_IN!: string;

  @IsInt()
  @Min(10)
  @Max(14)
  BCRYPT_SALT_ROUNDS!: number;

  // ── Throttle ──────────────────────────────────────────
  @IsInt()
  @Min(1000)
  THROTTLE_TTL!: number;

  @IsInt()
  @Min(1)
  THROTTLE_LIMIT!: number;

  // ── Mail ─────────────────────────────────────────────
  @IsString()
  @IsNotEmpty()
  MAIL_HOST!: string;

  @IsInt()
  @Min(1)
  MAIL_PORT!: number;

  @IsString()
  @IsNotEmpty()
  MAIL_USER!: string;

  @IsString()
  @IsNotEmpty()
  MAIL_PASSWORD!: string;

  @IsString()
  @IsNotEmpty()
  MAIL_FROM!: string;

  // ── Redis ─────────────────────────────────────────────
  @IsString()
  @IsNotEmpty()
  REDIS_HOST!: string;

  @IsInt()
  @Min(1)
  REDIS_PORT!: number;

  @IsString()
  @IsOptional() // password is optional for local Redis
  REDIS_PASSWORD?: string;
}

export function validate(config: Record<string, unknown>) {
  const validated = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });

  const errors = validateSync(validated, {
    skipMissingProperties: false,
  });

  if (errors.length > 0) {
    throw new Error(
      `Environment validation failed:\n${errors
        .map((e) => Object.values(e.constraints ?? {}).join(', '))
        .join('\n')}`,
    );
  }

  return validated;
}
