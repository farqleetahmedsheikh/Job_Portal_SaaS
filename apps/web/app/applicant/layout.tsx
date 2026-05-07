/** @format */

import { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "../lib/auth";
import { dashboardPathForRole } from "../lib/roles";
import { DashboardLayout } from "../components/layout/DashboardLayout";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    template: "%s | HiringFly",
    default: "Dashboard | HiringFly",
  },
  description:
    "Track your applications, interviews, and job search on HiringFly.",
  robots: { index: false, follow: false },
};

export default async function Layout({ children }: { children: ReactNode }) {
  const user = await getCurrentUser();
  if (user.role !== "applicant") redirect(dashboardPathForRole(user.role));

  return <DashboardLayout user={user}>{children}</DashboardLayout>;
}
