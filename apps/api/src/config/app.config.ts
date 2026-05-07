import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
  env: process.env.NODE_ENV ?? 'development',
  port: parseInt(process.env.PORT ?? '9000', 10),
  frontendUrl: process.env.FRONTEND_URL ?? 'http://localhost:3000',
  frontendUrls: (
    process.env.FRONTEND_URLS ??
    process.env.FRONTEND_URL ??
    'http://localhost:3000'
  )
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
  throttleTtl: parseInt(process.env.THROTTLE_TTL ?? '60000', 10),
  throttleLimit: parseInt(process.env.THROTTLE_LIMIT ?? '60', 10),
  bcryptRounds: parseInt(process.env.BCRYPT_SALT_ROUNDS ?? '12', 10),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '7d',
  cookieSameSite: process.env.COOKIE_SAMESITE ?? 'strict',
  cookieSecure:
    process.env.COOKIE_SECURE !== undefined
      ? process.env.COOKIE_SECURE === 'true'
      : process.env.NODE_ENV === 'production',
}));
