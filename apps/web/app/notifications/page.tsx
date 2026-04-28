/** @format */
/* eslint-disable react/no-unescaped-entities */
"use client";

import Link from "next/link";
import {
  Bell,
  Check,
  BriefcaseIcon,
  MessageSquare,
  Calendar,
  Gift,
  Info,
} from "lucide-react";
import { useNotifications } from "../hooks/useNotifications";
import type { Notification } from "../hooks/useNotifications";
import { timeAgo } from "../lib";
import styles from "./notifications.module.css";

const TYPE_ICON: Record<Notification["type"], React.ReactNode> = {
  application: <BriefcaseIcon size={15} />,
  message: <MessageSquare size={15} />,
  interview: <Calendar size={15} />,
  offer: <Gift size={15} />,
  system: <Info size={15} />,
};

const TYPE_LABEL: Record<Notification["type"], string> = {
  application: "Application",
  message: "Message",
  interview: "Interview",
  offer: "Offer",
  system: "System",
};

export default function NotificationsPage() {
  const { notifications, loading, unreadCount, markRead, markAllRead } =
    useNotifications();

  // Group by date
  const groups = notifications.reduce<Record<string, Notification[]>>(
    (acc, n) => {
      const day = new Date(n.createdAt).toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
      });
      (acc[day] ??= []).push(n);
      return acc;
    },
    {},
  );

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Notifications</h1>
          <p className={styles.subtitle}>
            {unreadCount > 0 ? `${unreadCount} unread` : "All caught up"}
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            className={`${styles.btn} ${styles.btnGhost}`}
            onClick={markAllRead}
          >
            <Check size={14} /> Mark all as read
          </button>
        )}
      </div>

      {/* Content */}
      {loading ? (
        <div className={styles.list}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className={styles.skeleton} style={{ height: 72 }} />
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <div className={styles.empty}>
          <Bell size={40} />
          <p>No notifications yet</p>
          <span>We'll let you know when something happens</span>
        </div>
      ) : (
        Object.entries(groups).map(([day, items]) => (
          <div key={day} className={styles.group}>
            <p className={styles.groupLabel}>{day}</p>
            <div className={styles.list}>
              {items.map((n) => (
                <Link
                  key={n.id}
                  href={n.href}
                  className={`${styles.item} ${!n.read ? styles.unread : ""}`}
                  onClick={() => markRead(n.id)}
                >
                  <div className={styles.iconWrap} data-type={n.type}>
                    {TYPE_ICON[n.type]}
                  </div>

                  <div className={styles.body}>
                    <div className={styles.topRow}>
                      <span className={styles.itemTitle}>{n.title}</span>
                      <span className={styles.time}>
                        {timeAgo(n.createdAt)}
                      </span>
                    </div>
                    <p className={styles.itemBody}>{n.body}</p>
                    <span className={styles.typeLabel}>
                      {TYPE_LABEL[n.type]}
                    </span>
                  </div>

                  {!n.read && (
                    <span className={styles.unreadDot} aria-label="Unread" />
                  )}
                </Link>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
