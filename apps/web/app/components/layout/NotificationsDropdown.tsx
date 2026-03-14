/** @format */
"use client";

import { useEffect, useRef } from "react";
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
import { timeAgo } from "../../lib";
import type { Notification } from "../../hooks/useNotifications";
import styles from "../../styles/navbar.module.css";

const TYPE_ICON: Record<Notification["type"], React.ReactNode> = {
  application: <BriefcaseIcon size={13} />,
  message: <MessageSquare size={13} />,
  interview: <Calendar size={13} />,
  offer: <Gift size={13} />,
  system: <Info size={13} />,
};

interface Props {
  notifications: Notification[];
  loading: boolean;
  unreadCount: number;
  onMarkRead: (id: string) => void;
  onMarkAllRead: () => void;
  onClose: () => void;
}

export function NotificationsDropdown({
  notifications,
  loading,
  unreadCount,
  onMarkRead,
  onMarkAllRead,
  onClose,
}: Props) {
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  return (
    <div ref={ref} className={styles.notifDropdown}>
      {/* Header */}
      <div className={styles.notifHeader}>
        <span className={styles.notifTitle}>
          Notifications
          {unreadCount > 0 && (
            <span className={styles.notifBadge}>{unreadCount}</span>
          )}
        </span>
        {unreadCount > 0 && (
          <button className={styles.markAllBtn} onClick={onMarkAllRead}>
            <Check size={11} /> Mark all read
          </button>
        )}
      </div>

      {/* List */}
      <div className={styles.notifList}>
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className={`${styles.notifItem} ${styles.skeleton}`}
              style={{ height: 56 }}
            />
          ))
        ) : notifications.length === 0 ? (
          <div className={styles.notifEmpty}>
            <Bell size={24} />
            <p>No notifications yet</p>
          </div>
        ) : (
          notifications.slice(0, 6).map((n) => (
            <Link
              key={n.id}
              href={n.href}
              className={`${styles.notifItem} ${!n.read ? styles.notifUnread : ""}`}
              onClick={() => {
                onMarkRead(n.id);
                onClose();
              }}
            >
              <span className={styles.notifIcon}>{TYPE_ICON[n.type]}</span>
              <div className={styles.notifBody}>
                <p className={styles.notifItemTitle}>{n.title}</p>
                <p className={styles.notifItemBody}>{n.body}</p>
                <span className={styles.notifTime}>{timeAgo(n.createdAt)}</span>
              </div>
              {!n.read && <span className={styles.unreadDot} />}
            </Link>
          ))
        )}
      </div>

      {/* Footer */}
      <Link
        href="/notifications"
        className={styles.notifFooter}
        onClick={onClose}
      >
        View all notifications
      </Link>
    </div>
  );
}
