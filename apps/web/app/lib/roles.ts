/** @format */

import type { UserRole } from "../types/user.types";

export const USER_ROLES = [
  "applicant",
  "employer",
  "admin",
  "super_admin",
  "supervisor",
] as const satisfies readonly UserRole[];

const ADMIN_ROLES = new Set<UserRole>(["admin", "super_admin", "supervisor"]);

export function normalizeRole(role: string | null | undefined): UserRole | null {
  if (!role) return null;
  const normalized = role.toLowerCase() as UserRole;
  return USER_ROLES.includes(normalized) ? normalized : null;
}

export function isAdminRole(role: string | null | undefined): boolean {
  const normalized = normalizeRole(role);
  return normalized ? ADMIN_ROLES.has(normalized) : false;
}

export function dashboardPathForRole(role: UserRole): string {
  if (isAdminRole(role)) return "/admin/dashboard";
  return role === "applicant" ? "/applicant/dashboard" : "/employer/dashboard";
}
