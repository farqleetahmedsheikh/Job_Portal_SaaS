/** @format */

import type { Metadata } from "next";
import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { AdminShell } from "./AdminShell";
import { getCurrentUser } from "../lib/auth";
import { dashboardPathForRole, isAdminRole } from "../lib/roles";

export const metadata: Metadata = {
  title: {
    template: "%s | HiringFly Admin",
    default: "Admin Panel | HiringFly",
  },
  robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const user = await getCurrentUser();
  if (!isAdminRole(user.role)) redirect(dashboardPathForRole(user.role));

  return <AdminShell currentUser={user}>{children}</AdminShell>;
}
