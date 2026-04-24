/** @format */

"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { io, Socket } from "socket.io-client";
import { api } from "../lib";
import { API_BASE } from "../constants";

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

const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:9000";

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const socketRef = useRef<Socket | null>(null);

  // ── Initial fetch ──────────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    api<Notification[]>(`${API_BASE}/notifications`, "GET")
      .then((data) => {
        if (!cancelled) {
          setNotifications(data);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // ── WebSocket for real-time ────────────────────────────────────────────────
  useEffect(() => {
    const socket = io(`${SOCKET_URL}/notifications`, {
      withCredentials: true,
      transports: ["websocket"],
    });

    socket.on("new_notification", (notif: Notification) => {
      // Prepend new notification and derive href from refType
      const withHref = {
        ...notif,
        href: resolveHref(notif),
      };
      setNotifications((prev) => [withHref, ...prev]);
    });

    socketRef.current = socket;
    return () => {
      socket.disconnect();
    };
  }, []);

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
function resolveHref(n: {
  refType?: string;
  refId?: string;
  href?: string;
}): string {
  if (n.href) return n.href;
  switch (n.refType) {
    case "application":
      return `/applications/${n.refId ?? ""}`;
    case "interview":
      return `/interviews/${n.refId ?? ""}`;
    case "job":
      return `/jobs/${n.refId ?? ""}`;
    case "message":
      return `/messages`;
    default:
      return "/notifications";
  }
}
