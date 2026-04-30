import {
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { UserRole } from '../../../common/enums/enums';

const ADMIN_ROLES = [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.SUPERVISOR];

@Injectable()
export class AdminAuthGuard extends JwtAuthGuard {
  handleRequest(err: unknown, user: { role?: UserRole } | null) {
    if (err || !user) {
      throw new UnauthorizedException('Authentication required');
    }
    if (!ADMIN_ROLES.includes(user.role as UserRole)) {
      throw new ForbiddenException('Admin access required');
    }
    return user;
  }
}
