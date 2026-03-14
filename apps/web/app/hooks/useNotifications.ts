/** @format */
"use client";

import { useState, useEffect, useCallback } from "react";
import { api } from "../lib";
import { API_BASE } from "../constants";

export interface Notification {
  id: string;
  type: "application" | "message" | "interview" | "offer" | "system";
  title: string;
  body: string;
  href: string;
  read: boolean;
  createdAt: string; // ISO
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

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
        if (!cancelled) {
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
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
