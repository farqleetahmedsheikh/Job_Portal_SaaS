import { ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { UserRole } from '../../../common/enums/enums';
import { AdminAuthGuard } from './admin-auth.guard';

describe('AdminAuthGuard', () => {
  const guard = new AdminAuthGuard();

  it('rejects missing users', () => {
    expect(() => guard.handleRequest(null, null)).toThrow(
      UnauthorizedException,
    );
  });

  it('rejects non-admin roles', () => {
    expect(() =>
      guard.handleRequest(null, { role: UserRole.EMPLOYER }),
    ).toThrow(ForbiddenException);
  });

  it('allows supervisor, admin, and super admin roles', () => {
    expect(guard.handleRequest(null, { role: UserRole.SUPERVISOR })).toEqual({
      role: UserRole.SUPERVISOR,
    });
    expect(guard.handleRequest(null, { role: UserRole.ADMIN })).toEqual({
      role: UserRole.ADMIN,
    });
    expect(guard.handleRequest(null, { role: UserRole.SUPER_ADMIN })).toEqual({
      role: UserRole.SUPER_ADMIN,
    });
  });
});
