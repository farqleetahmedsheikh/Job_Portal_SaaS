import {
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { UserRole } from '../../../common/enums/user-role.enum';
import { normalizeUserRole } from '../../../common/utils/role.util';

const ADMIN_ROLES = [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.SUPERVISOR];

@Injectable()
export class AdminAuthGuard extends JwtAuthGuard {
  handleRequest(err: unknown, user: { role?: UserRole } | null) {
    if (err || !user) {
      throw new UnauthorizedException('Authentication required');
    }
    const role = normalizeUserRole(user.role);
    if (!role || !ADMIN_ROLES.includes(role)) {
      throw new ForbiddenException('Admin access required');
    }
    return { ...user, role };
  }
}
