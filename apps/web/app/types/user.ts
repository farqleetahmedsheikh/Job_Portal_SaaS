/** @format */

export type UserRole = "APPLICANT" | "EMPLOYER";

export interface User {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
  avatar?: string | null;
}
