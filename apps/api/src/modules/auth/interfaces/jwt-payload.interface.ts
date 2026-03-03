import { UserRole } from '../../../common/enums/user-role.enum';

export interface JwtPayload {
  sub: string; // user ID (matches JWT `sub`)
  userId: string; // same as sub, for convenience
  role: UserRole; // role of the user
  iat?: number; // issued at (optional, from JWT)
  exp?: number; // expiry (optional, from JWT)
}
