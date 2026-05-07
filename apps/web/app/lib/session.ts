/** @format */

import type { SafeCompany, SessionUser, UserRole } from "../types/user.types";
import { normalizeRole } from "./roles";
import { DEFAULT_COUNTRY, DEFAULT_TIMEZONE } from "./region";

export type RawSessionUser = Omit<SessionUser, "role" | "company"> & {
  role: string;
  company?: SafeCompany | null;
  companies?: SafeCompany | null;
};

export function normalizeSessionUser(user: RawSessionUser): SessionUser {
  const role = normalizeRole(user.role);
  if (!role) {
    throw new Error("Invalid user role returned by API");
  }

  const normalizedRole: UserRole = role;
  const { companies, company, ...rest } = user;

  return {
    ...rest,
    country: rest.country ?? DEFAULT_COUNTRY,
    timezone: rest.timezone ?? DEFAULT_TIMEZONE,
    role: normalizedRole,
    company: company ?? companies ?? null,
  };
}
