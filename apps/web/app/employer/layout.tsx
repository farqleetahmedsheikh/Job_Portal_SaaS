/** @format */

import { ReactNode } from "react";
import { getCurrentUser } from "../lib/auth";
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

  return <DashboardLayout user={user}>{children}</DashboardLayout>;
}
