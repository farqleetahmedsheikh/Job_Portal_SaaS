// auth/strategies/jwt.strategy.ts
/* eslint-disable @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment */
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { UsersService } from '../../users/users.service';

// Extracts token from cookie — NOT Authorization header
const cookieExtractor = (req: Request): string | null => {
  console.log('🍪 Cookies received:', req.cookies); // ← add this temporarily
  return req?.cookies?.['token'] ?? null;
};

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly users: UsersService,
    private readonly config: ConfigService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([cookieExtractor]),
      ignoreExpiration: false,
      secretOrKey: config.get<string>('JWT_SECRET'),
    });
  }

  async validate(payload: { sub: string; role: string }) {
    console.log('✅ JWT payload validated:', payload); // ← add temporarily
    const user = await this.users.findById(payload.sub);
    if (!user) throw new UnauthorizedException('User not found');
    return { sub: user.id, role: user.role };
  }
}
