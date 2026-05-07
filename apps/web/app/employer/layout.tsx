/** @format */

import { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "../lib/auth";
import { dashboardPathForRole } from "../lib/roles";
import { DashboardLayout } from "../components/layout/DashboardLayout";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    template: "%s | HiringFly for Employers",
    default: "Employer Dashboard | HiringFly",
  },
  description:
    "Manage job postings, track candidates, and run your hiring pipeline on HiringFly.",
  robots: { index: false, follow: false }, // keep dashboard pages out of search
};

export default async function Layout({ children }: { children: ReactNode }) {
  const user = await getCurrentUser();
  if (user.role !== "employer") redirect(dashboardPathForRole(user.role));

  return <DashboardLayout user={user}>{children}</DashboardLayout>;
}
