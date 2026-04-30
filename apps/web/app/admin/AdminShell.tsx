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
import { useUser } from "../store/session.store";
import styles from "./admin.module.css";

const nav = [
  { label: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
  { label: "Users", href: "/admin/users", icon: Users },
  { label: "Companies", href: "/admin/companies", icon: Building2 },
  { label: "Complaints", href: "/admin/complaints", icon: LifeBuoy },
  { label: "Billing", href: "/admin/transactions", icon: CreditCard },
  { label: "Logs", href: "/admin/logs", icon: ScrollText },
  { label: "Settings", href: "/admin/settings", icon: Settings },
];

function roleLabel(role?: string | null) {
  if (role === "super_admin") return "Super Admin";
  if (role === "supervisor") return "Supervisor";
  if (role === "admin") return "Admin";
  return "Admin";
}

export function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const user = useUser();

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
          {nav.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`${styles.navItem} ${active ? styles.navActive : ""}`}
              >
                <Icon size={17} />
                <span>{item.label}</span>
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
        <main className={styles.content}>{children}</main>
      </div>
    </div>
  );
}
