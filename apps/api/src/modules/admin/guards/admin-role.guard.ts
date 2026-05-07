import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '../../../common/enums/user-role.enum';
import { rolesMatch } from '../../../common/utils/role.util';

export const ADMIN_ROLES_KEY = 'admin_roles';
export const AdminRoles = (...roles: UserRole[]) =>
  Reflect.metadata(ADMIN_ROLES_KEY, roles);

@Injectable()
export class AdminRolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(ctx: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<UserRole[]>(
      ADMIN_ROLES_KEY,
      [ctx.getHandler(), ctx.getClass()],
    );
    if (!required?.length) return true;

    const request = ctx
      .switchToHttp()
      .getRequest<{ user?: { role?: UserRole } }>();
    return rolesMatch(request.user?.role, required);
  }
}
