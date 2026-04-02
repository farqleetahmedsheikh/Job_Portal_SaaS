/** @format */

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    template: "%s | HiringFly",
    default: "Messages | HiringFly",
  },
  description:
    "Track your applications, interviews, and job search on HiringFly.",
  robots: { index: false, follow: false },
};

export default function ApplicantLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
