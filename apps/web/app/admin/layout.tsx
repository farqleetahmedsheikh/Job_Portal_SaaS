/** @format */

import type { Metadata } from "next";
import type { ReactNode } from "react";
import { AdminShell } from "./AdminShell";

export const metadata: Metadata = {
  title: {
    template: "%s | HiringFly Admin",
    default: "Admin Panel | HiringFly",
  },
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: ReactNode }) {
  return <AdminShell>{children}</AdminShell>;
}
