/** @format */

"use client";

import { ReactNode, useState } from "react";
import { User } from "../../types/user";
import { Navbar } from "./Navbar";
import { Sidebar } from "./Sidebar";
import "../../styles/dashboard.css";

interface Props {
  user: User;
  children: ReactNode;
}

export const DashboardLayout = ({ user, children }: Props) => {
  const [collapsed, setCollapsed] = useState<boolean>(false);

  return (
    <div className={`dashboard ${collapsed ? "collapsed" : ""}`}>
      <Sidebar
        role={user.role}
        collapsed={collapsed}
        onToggle={() => setCollapsed(!collapsed)}
      />
      <div className="dashboard-main">
        <Navbar user={user} />
        <main className="dashboard-content">{children}</main>
      </div>
    </div>
  );
};
