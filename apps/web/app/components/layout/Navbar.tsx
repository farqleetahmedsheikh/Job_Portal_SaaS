/** @format */
"use client";

import { useState } from "react";
import Link from "next/link";
import { Bell, MessageSquare } from "lucide-react";
import { useUser } from "../../store/session.store";
import { useNotifications } from "../../hooks/useNotifications";
import { Avatar } from "../ui/Avatar";
import { ThemeToggle } from "../theme/ThemeToggler";
import { NotificationsDropdown } from "./NotificationsDropdown";
import styles from "../../styles/navbar.module.css";

export function Navbar() {
  const user = useUser();
  const { notifications, loading, unreadCount, markRead, markAllRead } =
    useNotifications();
  const [notifOpen, setNotifOpen] = useState(false);

  // Derive display values from session — no props needed
  const fullName = user?.fullName ?? "—";
  const avatar = user?.avatar ?? null;
  const role = user?.role ?? "-";
  const subtitle =
    role === "applicant"
      ? (user?.applicantProfile?.jobTitle ?? "Applicant")
      : (user?.company?.companyName ?? "Employer");

  const profileHref = `/${role}/profile`;
  const messagesHref = `/${role}/messages`;

  return (
    <header className={styles.navbar}>
      {/* Logo */}
      <Link href="/" className={styles.logo}>
        <span className={styles["logo-text"]}>
          Hire<span>Sphere</span>
        </span>
      </Link>

      {/* Right actions */}
      <div className={styles.right}>
        {/* Messages */}
        <Link
          href={messagesHref}
          className={styles["icon-btn"]}
          aria-label="Messages"
        >
          <MessageSquare size={17} />
        </Link>

        {/* Notifications */}
        <div className={styles.notifWrap}>
          <button
            className={styles["icon-btn"]}
            aria-label="Notifications"
            onClick={() => setNotifOpen((p) => !p)}
          >
            <Bell size={17} />
            {unreadCount > 0 && (
              <span className={styles.dot} aria-hidden>
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>

          {notifOpen && (
            <NotificationsDropdown
              notifications={notifications}
              loading={loading}
              unreadCount={unreadCount}
              onMarkRead={markRead}
              onMarkAllRead={markAllRead}
              onClose={() => setNotifOpen(false)}
            />
          )}
        </div>

        <ThemeToggle />

        <div className={styles.divider} />

        {/* User pill */}
        <Link href={profileHref} className={styles["user-pill"]}>
          <Avatar name={fullName} src={avatar} />
          <div className={styles["user-meta"]}>
            <span className={styles["user-name"]}>{fullName}</span>
            <span className={styles["user-role"]}>{subtitle}</span>
          </div>
          <svg
            className={styles.chevron}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
        </Link>
      </div>
    </header>
  );
}
