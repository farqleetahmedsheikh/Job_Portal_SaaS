/** @format */

"use client";

import { type ReactNode, useState } from "react";
import type { User } from "../../types/user.types";
import { OnboardingExperience } from "../onboarding/OnboardingExperience";
import { FloatingSupportButton } from "../support/FloatingSupportButton";
import { Navbar } from "./Navbar";
import { Sidebar } from "./Sidebar";
import styles from "../../styles/dashboard.module.css";

interface Props {
  user: User;
  children: ReactNode;
}

export const DashboardLayout = ({ user, children }: Props) => {
  const [collapsed, setCollapsed] = useState<boolean>(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState<boolean>(false);

  return (
    <div
      className={styles.dashboard + " " + (collapsed ? styles.collapsed : "")}
    >
      <Sidebar
        collapsed={collapsed}
        mobileOpen={mobileSidebarOpen}
        onNavigate={() => setMobileSidebarOpen(false)}
        onToggle={() => setCollapsed(!collapsed)}
      />
      {mobileSidebarOpen && (
        <button
          className={styles["sidebar-overlay"]}
          aria-label="Close navigation"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}
      <div className={styles["dashboard-main"]}>
        <Navbar onMenuClick={() => setMobileSidebarOpen(true)} />
        <main className={styles["dashboard-content"]}>{children}</main>
      </div>
      <OnboardingExperience />
      <FloatingSupportButton user={user} />
    </div>
  );
};
