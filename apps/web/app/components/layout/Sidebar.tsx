/** @format */
"use client";

import { UserRole } from "../../types/user";
import { Icon } from "../ui/Icon";
import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "../../styles/sidebar.module.css";

interface SidebarProps {
  role: UserRole;
  collapsed: boolean;
  onToggle: () => void;
  userName?: string;
}

interface NavItem {
  label: string;
  icon: string;
  href: string;
}

interface NavSection {
  label: string;
  items: NavItem[];
}

const NAVIGATION: Record<UserRole, NavSection[]> = {
  APPLICANT: [
    {
      label: "Main",
      items: [
        { label: "Dashboard", icon: "dashboard", href: "dashboard" },
        { label: "Browse Jobs", icon: "search", href: "browse-jobs" },
        { label: "Applications", icon: "briefcase", href: "applications" },
        { label: "Saved Jobs", icon: "bookmark", href: "saved" },
      ],
    },
    {
      label: "Account",
      items: [
        { label: "Profile", icon: "user", href: "profile" },
        { label: "Settings", icon: "setting", href: "settings" },
      ],
    },
  ],
  EMPLOYER: [
    {
      label: "Main",
      items: [
        { label: "Dashboard", icon: "layout-dashboard", href: "employer" },
        { label: "Post Job", icon: "plus-circle", href: "post-job" },
        { label: "Candidates", icon: "users", href: "candidates" },
        { label: "Company", icon: "building-2", href: "company" },
      ],
    },
    {
      label: "Account",
      items: [
        { label: "Profile", icon: "user", href: "/profile" },
        { label: "Settings", icon: "settings", href: "/settings" },
      ],
    },
  ],
};

export const Sidebar = ({
  role,
  collapsed,
  onToggle,
  userName = "Alex Johnson",
}: SidebarProps) => {
  const pathname = usePathname();
  const sections = NAVIGATION[role];
  const initials = userName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
  const roleLabel = role.charAt(0) + role.slice(1).toLowerCase();

  const ChevronIcon = () => (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m15 18-6-6 6-6" />
    </svg>
  );

  return (
    <aside className={`${styles.sidebar} ${collapsed ? styles.collapsed : ""}`}>
      {/* Toggle */}
      <button
        className={styles.toggle}
        onClick={onToggle}
        aria-label="Toggle sidebar"
      >
        <ChevronIcon />
      </button>

      {/* Nav sections */}
      <nav className={styles.nav}>
        {sections.map((section, si) => (
          <div key={section.label}>
            {si > 0 && <div className={styles.divider} />}

            {!collapsed && (
              <div className={styles["section-label"]}>{section.label}</div>
            )}

            {section.items.map((item) => {
              const isActive =
                pathname === item.href || pathname.startsWith(item.href + "/");
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className={`${styles["nav-item"]} ${isActive ? styles.active : ""}`}
                  title={collapsed ? item.label : undefined}
                >
                  <span className={styles["nav-icon"]}>
                    <Icon name={item.icon} size={17} />
                  </span>
                  <span className={styles["nav-label"]}>{item.label}</span>
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Bottom user strip */}
      <div className={styles.divider} />
      <Link
        href="/profile"
        className={styles["user-strip"]}
        title={collapsed ? userName : undefined}
      >
        <div className={styles["user-avatar"]}>{initials}</div>
        <div className={styles["user-info"]}>
          <span className={styles["user-name"]}>{userName}</span>
          <span className={styles["user-role"]}>{roleLabel}</span>
        </div>
      </Link>
    </aside>
  );
};
