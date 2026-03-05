/** @format */

import { ReactNode } from "react";
import { getCurrentUser } from "../lib/auth";
import { DashboardLayout } from "../components/layout/DashboardLayout";

export default async function Layout({ children }: { children: ReactNode }) {
  const user = await getCurrentUser();

  return <DashboardLayout user={user}>{children}</DashboardLayout>;
}
