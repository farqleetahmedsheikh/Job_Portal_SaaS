/** @format */

import { ReactNode } from "react";
import { getCurrentUser } from "../lib/auth";
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

  return <DashboardLayout user={user}>{children}</DashboardLayout>;
}
