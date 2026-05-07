/** @format */

"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { io, Socket } from "socket.io-client";
import { api } from "../lib";
import { API_BASE } from "../constants";
import { SOCKET_SERVER_ORIGIN } from "../lib/socket";
import { useUser } from "../store/session.store";

export interface Notification {
  id: string;
  type: "application" | "message" | "interview" | "offer" | "system";
  title: string;
  body: string;
  href: string;
  read: boolean;
  refType?: "application" | "interview" | "job" | "message"; // ← add
  refId?: string;
  createdAt: string;
}

export function useNotifications() {
  const user = useUser();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const socketRef = useRef<Socket | null>(null);

  // ── Initial fetch ──────────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    api<Notification[]>(`${API_BASE}/notifications`, "GET")
      .then((data) => {
        if (!cancelled) {
          setNotifications(
            data.map((notif) => ({
              ...notif,
              href: resolveHref(notif, user?.role),
            })),
          );
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [user?.role]);

  // ── WebSocket for real-time ────────────────────────────────────────────────
  useEffect(() => {
    const socket = io(`${SOCKET_SERVER_ORIGIN}/notifications`, {
      withCredentials: true,
      transports: ["websocket"],
    });

    socket.on("new_notification", (notif: Notification) => {
      // Prepend new notification and derive href from refType
      const withHref = {
        ...notif,
        href: resolveHref(notif, user?.role),
      };
      setNotifications((prev) => [withHref, ...prev]);
    });

    socketRef.current = socket;
    return () => {
      socket.disconnect();
    };
  }, [user?.role]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markRead = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
    );
    api(`${API_BASE}/notifications/${id}/read`, "PATCH").catch(() => {});
  }, []);

  const markAllRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    api(`${API_BASE}/notifications/read-all`, "PATCH").catch(() => {});
  }, []);

  return { notifications, loading, unreadCount, markRead, markAllRead };
}

// ── Derive link from notification refType ──────────────────────────────────
function resolveHref(
  n: {
    refType?: string;
    refId?: string;
    href?: string;
  },
  role = "applicant",
): string {
  if (n.href) return n.href;
  const baseRole = role === "employer" ? "employer" : "applicant";
  switch (n.refType) {
    case "application":
      return baseRole === "employer"
        ? "/employer/applicants"
        : "/applicant/applications";
    case "interview":
      return `/${baseRole}/interviews`;
    case "job":
      return n.refId
        ? `/${baseRole}/jobs/${n.refId}`
        : baseRole === "employer"
          ? "/employer/jobs"
          : "/applicant/browse-jobs";
    case "message":
      return `/${baseRole}/messages`;
    default:
      return "/notifications";
  }
}
