import { plainToInstance } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsString,
  IsNotEmpty,
  IsOptional,
  ValidateIf,
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

  @IsOptional()
  @IsString()
  FRONTEND_URLS?: string;

  @IsOptional()
  @IsString()
  COOKIE_SAMESITE?: string;

  @IsOptional()
  @IsString()
  COOKIE_SECURE?: string;

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
  @ValidateIf(
    (env: { NODE_ENV?: Environment; MAIL_HOST?: string }) =>
      env.NODE_ENV === Environment.Production || env.MAIL_HOST !== undefined,
  )
  @IsString()
  @IsNotEmpty()
  MAIL_HOST?: string;

  @ValidateIf(
    (env: { NODE_ENV?: Environment; MAIL_HOST?: string }) =>
      env.NODE_ENV === Environment.Production || env.MAIL_HOST !== undefined,
  )
  @IsInt()
  @Min(1)
  MAIL_PORT?: number;

  @ValidateIf(
    (env: { NODE_ENV?: Environment; MAIL_HOST?: string }) =>
      env.NODE_ENV === Environment.Production || env.MAIL_HOST !== undefined,
  )
  @IsString()
  @IsNotEmpty()
  MAIL_USER?: string;

  @ValidateIf(
    (env: { NODE_ENV?: Environment; MAIL_HOST?: string }) =>
      env.NODE_ENV === Environment.Production || env.MAIL_HOST !== undefined,
  )
  @IsString()
  @IsNotEmpty()
  MAIL_PASSWORD?: string;

  @ValidateIf(
    (env: { NODE_ENV?: Environment; MAIL_HOST?: string }) =>
      env.NODE_ENV === Environment.Production || env.MAIL_HOST !== undefined,
  )
  @IsString()
  @IsNotEmpty()
  MAIL_FROM?: string;

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

  // ── Payment providers ─────────────────────────────────
  @IsOptional()
  @IsString()
  SAFEPAY_API_KEY?: string;

  @IsOptional()
  @IsString()
  SAFEPAY_MERCHANT_ID?: string;

  @IsOptional()
  @IsString()
  SAFEPAY_WEBHOOK_SECRET?: string;

  @IsOptional()
  @IsString()
  STRIPE_SECRET_KEY?: string;

  // ── Bootstrap seed ────────────────────────────────────
  @IsOptional()
  @IsString()
  SUPER_ADMIN_EMAIL?: string;

  @IsOptional()
  @IsString()
  SUPER_ADMIN_PASSWORD?: string;

  @IsOptional()
  @IsString()
  SUPER_ADMIN_FULL_NAME?: string;
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
