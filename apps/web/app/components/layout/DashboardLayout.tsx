/** @format */
/* eslint-disable @typescript-eslint/no-unused-vars */

"use client";

import { ReactNode, useState } from "react";
import { User } from "../../types/user.types";
import { Navbar } from "./Navbar";
import { Sidebar } from "./Sidebar";
import styles from "../../styles/dashboard.module.css";

interface Props {
  user: User;
  children: ReactNode;
}

export const DashboardLayout = ({ user, children }: Props) => {
  const [collapsed, setCollapsed] = useState<boolean>(false);

  return (
    <div
      className={styles.dashboard + " " + (collapsed ? styles.collapsed : "")}
    >
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
      <div className={styles["dashboard-main"]}>
        <Navbar />
        <main className={styles["dashboard-content"]}>{children}</main>
      </div>
    </div>
  );
};
