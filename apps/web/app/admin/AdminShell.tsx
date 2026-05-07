/** @format */
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import {
  BarChart3,
  Bell,
  Building2,
  CreditCard,
  LayoutDashboard,
  LifeBuoy,
  ScrollText,
  Settings,
  Shield,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useUser } from "../store/session.store";
import type { User, UserRole } from "../types/user.types";
import styles from "./admin.module.css";

type AdminRole = Extract<UserRole, "super_admin" | "admin" | "supervisor">;

const nav: {
  label: string;
  supervisorLabel?: string;
  href: string;
  icon: LucideIcon;
  roles: AdminRole[];
}[] = [
  {
    label: "Dashboard",
    supervisorLabel: "Support Dashboard",
    href: "/admin/dashboard",
    icon: LayoutDashboard,
    roles: ["super_admin", "admin", "supervisor"],
  },
  { label: "Admin Team", href: "/admin/team", icon: Shield, roles: ["super_admin"] },
  { label: "Users", href: "/admin/users", icon: Users, roles: ["super_admin", "admin"] },
  { label: "Companies", href: "/admin/companies", icon: Building2, roles: ["super_admin", "admin"] },
  { label: "Complaints", href: "/admin/complaints", icon: LifeBuoy, roles: ["super_admin", "admin", "supervisor"] },
  { label: "Billing", href: "/admin/transactions", icon: CreditCard, roles: ["super_admin", "admin"] },
  { label: "Logs", href: "/admin/logs", icon: ScrollText, roles: ["super_admin", "admin"] },
  { label: "Settings", href: "/admin/settings", icon: Settings, roles: ["super_admin"] },
];

function roleLabel(role?: string | null) {
  if (role === "super_admin") return "Super Admin";
  if (role === "supervisor") return "Supervisor";
  if (role === "admin") return "Admin";
  return "Admin";
}

function adminRole(role?: UserRole | null): AdminRole | null {
  if (role === "super_admin" || role === "admin" || role === "supervisor") {
    return role;
  }
  return null;
}

function canAccess(pathname: string, role: AdminRole | null) {
  if (!role) return false;
  return nav.some(
    (item) =>
      item.roles.includes(role) &&
      (pathname === item.href || pathname.startsWith(item.href + "/")),
  );
}

function NotAllowed() {
  return (
    <div className={styles.page}>
      <div className={styles.panel}>
        <div className={styles.panelHeader}>
          <h2>Not allowed</h2>
        </div>
        <p className={styles.subtitle}>
          Your admin role does not include access to this section.
        </p>
        <div className={styles.actions}>
          <Link href="/admin/dashboard" className={styles.btn}>
            Back to dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}

export function AdminShell({
  children,
  currentUser,
}: {
  children: ReactNode;
  currentUser: User;
}) {
  const pathname = usePathname();
  const user = useUser() ?? currentUser;
  const role = adminRole(user.role);
  const visibleNav = nav.filter((item) => role && item.roles.includes(role));
  const allowed = canAccess(pathname, role);

  return (
    <div className={styles.shell}>
      <aside className={styles.sidebar}>
        <Link href="/admin/dashboard" className={styles.brand}>
          <span className={styles.brandMark}>HF</span>
          <span>
            Hiring<span>Fly</span>
          </span>
        </Link>
        <div className={styles.roleCard}>
          <Shield size={18} />
          <div>
            <strong>{roleLabel(user?.role)}</strong>
            <span>{user?.email ?? "Protected admin area"}</span>
          </div>
        </div>
        <nav className={styles.nav}>
          {visibleNav.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href || pathname.startsWith(item.href + "/");
            const label = role === "supervisor" && item.supervisorLabel ? item.supervisorLabel : item.label;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`${styles.navItem} ${active ? styles.navActive : ""}`}
              >
                <Icon size={17} />
                <span>{label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>
      <div className={styles.main}>
        <header className={styles.topbar}>
          <div>
            <span className={styles.kicker}>System Control</span>
            <strong>Admin Panel</strong>
          </div>
          <div className={styles.topActions}>
            <Link href="/admin/dashboard" className={styles.iconBtn} aria-label="Insights">
              <BarChart3 size={17} />
            </Link>
            <Link href="/notifications" className={styles.iconBtn} aria-label="Notifications">
              <Bell size={17} />
            </Link>
            <span className={styles.roleBadge}>{roleLabel(user?.role)}</span>
          </div>
        </header>
        <main className={styles.content}>{allowed ? children : <NotAllowed />}</main>
      </div>
    </div>
  );
}
