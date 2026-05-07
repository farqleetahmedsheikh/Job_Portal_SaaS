/** @format */
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useUser } from "../../store/session.store";
import {
  LayoutDashboard,
  Search,
  Briefcase,
  Bookmark,
  User,
  Settings,
  Users,
  Calendar,
  MessageSquare,
  Building2,
  BarChart2,
  FileIcon,
  type LucideIcon,
  CreditCard,
  Database,
  FileText,
  Zap,
} from "lucide-react";
import styles from "../../styles/sidebar.module.css";
import Image from "next/image";

// ── Nav config — icon is a component, never a string ─────────────────────────
interface NavItem {
  label: string;
  icon: LucideIcon;
  href: string;
}
interface NavSection {
  label: string;
  items: NavItem[];
}

const NAVIGATION: Record<"applicant" | "employer", NavSection[]> = {
  applicant: [
    {
      label: "Main",
      items: [
        {
          label: "Dashboard",
          icon: LayoutDashboard,
          href: "/applicant/dashboard",
        },
        { label: "Browse Jobs", icon: Search, href: "/applicant/browse-jobs" },
        {
          label: "Applications",
          icon: Briefcase,
          href: "/applicant/applications",
        },
        { label: "Saved Jobs", icon: Bookmark, href: "/applicant/saved-jobs" },
        { label: "Resumes", icon: FileIcon, href: "/applicant/resumes" },
        { label: "Interviews", icon: Calendar, href: "/applicant/interviews" },
        { label: "Messages", icon: MessageSquare, href: "/applicant/messages" },
      ],
    },
    {
      label: "Account",
      items: [
        { label: "Profile", icon: User, href: "/applicant/profile" },
        { label: "Settings", icon: Settings, href: "/applicant/settings" },
      ],
    },
  ],
  employer: [
    {
      label: "Main",
      items: [
        {
          label: "Dashboard",
          icon: LayoutDashboard,
          href: "/employer/dashboard",
        },
        { label: "Jobs", icon: Briefcase, href: "/employer/jobs" },
        { label: "Applicants", icon: Users, href: "/employer/applicants" },
        { label: "Talent Database", icon: Database, href: "/employer/talent" },
        { label: "Interviews", icon: Calendar, href: "/employer/interviews" },
        { label: "Automation", icon: Zap, href: "/employer/automation" },
        { label: "Contracts", icon: FileText, href: "/employer/contracts" },
        { label: "Messages", icon: MessageSquare, href: "/employer/messages" },
        { label: "Company", icon: Building2, href: "/employer/company" },
      ],
    },
    {
      label: "Account",
      items: [
        { label: "Profile", icon: User, href: "/employer/profile" },
        { label: "Analytics", icon: BarChart2, href: "/employer/analytics" },
        { label: "Billing", icon: CreditCard, href: "/employer/billing" },
      ],
    },
  ],
};

function toInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function tourIdForHref(href: string) {
  const map: Record<string, string> = {
    "/employer/dashboard": "employer-dashboard",
    "/employer/jobs": "employer-jobs",
    "/employer/applicants": "employer-applicants",
    "/employer/interviews": "employer-interviews",
    "/employer/automation": "employer-automation",
    "/applicant/dashboard": "applicant-dashboard",
    "/applicant/browse-jobs": "applicant-browse-jobs",
    "/applicant/applications": "applicant-applications",
    "/applicant/profile": "applicant-profile",
    "/applicant/resumes": "applicant-profile",
    "/applicant/interviews": "applicant-interviews",
  };

  return map[href];
}

const ChevronLeft = () => (
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

interface Props {
  collapsed: boolean;
  mobileOpen?: boolean;
  onNavigate?: () => void;
  onToggle: () => void;
}

export function Sidebar({
  collapsed,
  mobileOpen = false,
  onNavigate,
  onToggle,
}: Props) {
  const pathname = usePathname();
  const user = useUser();

  const role = user?.role === "employer" ? "employer" : "applicant";
  const userName = user?.fullName ?? "—";
  const avatar = user?.avatar ?? null;
  const subtitle =
    role === "applicant"
      ? (user?.applicantProfile?.jobTitle ?? "Applicant")
      : (user?.company?.companyName ?? "Employer");

  const sections = NAVIGATION[role];
  const profileHref = `/${role}/profile`;
  const homeHref = `/${role}/dashboard`;

  return (
    <aside
      className={`${styles.sidebar} ${collapsed ? styles.collapsed : ""} ${
        mobileOpen ? styles["mobile-open"] : ""
      }`}
    >
      <div className={styles["sidebar-head"]}>
        <Link
          href={homeHref}
          className={styles.brand}
          title={collapsed ? "HiringFly" : undefined}
          onClick={onNavigate}
        >
          <span className={styles["brand-mark"]}>HF</span>
          <span className={styles["brand-text"]}>
            Hiring<span>Fly</span>
          </span>
        </Link>
        <button
          className={styles.toggle}
          onClick={onToggle}
          aria-label="Toggle sidebar"
        >
          <ChevronLeft />
        </button>
      </div>

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
              // Render icon as a component — no string lookup, no missing icons
              const IconComponent = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`${styles["nav-item"]} ${isActive ? styles.active : ""}`}
                  data-tour-id={tourIdForHref(item.href)}
                  title={collapsed ? item.label : undefined}
                  onClick={onNavigate}
                >
                  <span className={styles["nav-icon"]}>
                    <IconComponent size={17} />
                  </span>
                  <span className={styles["nav-label"]}>{item.label}</span>
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      <div className={styles.divider} />
      <Link
        href={profileHref}
        className={styles["user-strip"]}
        title={collapsed ? userName : undefined}
        onClick={onNavigate}
      >
        {avatar ? (
          <Image
            src={avatar}
            alt={userName}
            className={styles["user-avatar"]}
            width={40}
            height={40}
          />
        ) : (
          <div className={styles["user-avatar"]}>{toInitials(userName)}</div>
        )}
        <div className={styles["user-info"]}>
          <span className={styles["user-name"]}>{userName}</span>
          <span className={styles["user-role"]}>{subtitle}</span>
        </div>
      </Link>
    </aside>
  );
}
