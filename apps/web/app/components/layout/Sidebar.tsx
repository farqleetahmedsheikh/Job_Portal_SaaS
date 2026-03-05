/** @format */

"use client";

import { UserRole } from "../../types/user";
import { Icon } from "../ui/Icon";
import Link from "next/link";
import styles from "../../styles/sidebar.module.css";

interface SidebarProps {
  role: UserRole;
  collapsed: boolean;
  onToggle: () => void;
}

interface NavItem {
  label: string;
  icon: string;
  href: string;
}

const NAVIGATION: Record<UserRole, NavItem[]> = {
  APPLICANT: [
    { label: "Dashboard", icon: "dashboard", href: "/applicant" },
    { label: "Applications", icon: "briefcase", href: "/applications" },
    { label: "Saved Jobs", icon: "bookmark", href: "/saved" },
    { label: "Profile", icon: "user", href: "/profile" },
  ],
  EMPLOYER: [
    { label: "Dashboard", icon: "dashboard", href: "/employer" },
    { label: "Post Job", icon: "plus", href: "/post-job" },
    { label: "Candidates", icon: "users", href: "/candidates" },
    { label: "Company", icon: "building", href: "/company" },
  ],
};

export const Sidebar = ({ role, collapsed, onToggle }: SidebarProps) => {
  const navItems = NAVIGATION[role];

  return (
    <aside className={`${styles.sidebar} ${collapsed ? styles.collapsed : ""}`}>
      <div className={styles["sidebar-header"]}>
        <span className={styles.logo}>HireSphere</span>
        <button
          onClick={onToggle}
          className={`${styles["collapse-btn"]}`}
        >
          ☰
        </button>
      </div>

      <nav>
        {navItems.map((item) => (
          <Link
            key={item.label}
            href={item.href}
            className={styles["nav-item"]}
          >
            <Icon name={item.icon} />
            {!collapsed && <span>{item.label}</span>}
          </Link>
        ))}
      </nav>
    </aside>
  );
};
