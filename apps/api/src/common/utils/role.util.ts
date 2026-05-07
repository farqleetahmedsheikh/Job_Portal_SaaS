import { UserRole } from '../enums/user-role.enum';

const USER_ROLES = new Set<string>(Object.values(UserRole));

export function normalizeUserRole(value: unknown): UserRole | undefined {
  if (typeof value !== 'string') return undefined;
  const role = value.toLowerCase();
  return USER_ROLES.has(role) ? (role as UserRole) : undefined;
}

export function rolesMatch(actual: unknown, required: readonly unknown[]) {
  const normalizedActual = normalizeUserRole(actual);
  if (!normalizedActual) return false;

  return required.some((role) => normalizeUserRole(role) === normalizedActual);
}
