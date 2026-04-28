/** @format */
interface FetchOptions extends RequestInit {
  credentials?: RequestCredentials;
}

export async function api<T = unknown>(
  url: string,
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE" = "GET",
  body?: unknown,
  options: FetchOptions = {},
): Promise<T> {
  const res = await fetch(url, {
    method,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
    ...options,
  });

  if (res.status === 401) {
    if (typeof window === "undefined") {
      throw new Error("Session expired");
    }

    const authRoutes = [
      "/login",
      "/register",
      "/complete-profile",
      "/forgot-password",
    ];
    const isAuthPage = authRoutes.some((r) =>
      window.location.pathname.startsWith(r),
    );

    if (!isAuthPage) {
      window.location.href = "/login?reason=expired";
    }

    throw new Error("Session expired");
  }

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(error.message ?? "Request failed");
  }

  if (res.status === 204) return undefined as T;

  return res.json() as Promise<T>;
}

export const initials = (name: string): string =>
  name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

export const capitalize = (str: string): string =>
  str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();

// Add these to your existing app/lib/index.ts

/** "10m ago", "2h ago", "Yesterday", "Mar 1" */
export function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins  = Math.floor(diff / 60_000);
  const hours = Math.floor(diff / 3_600_000);
  const days  = Math.floor(diff / 86_400_000);

  if (mins  < 1)   return "Just now";
  if (mins  < 60)  return `${mins}m ago`;
  if (hours < 24)  return `${hours}h ago`;
  if (days  === 1) return "Yesterday";
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

/** "Mar 1, 2025" */
export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
  });
}

/** "Today, 2:00 PM" or "Mar 12, 10:00 AM" */
export function formatDateTime(iso: string): string {
  const date  = new Date(iso);
  const today = new Date();
  const isToday =
    date.getDate()     === today.getDate()     &&
    date.getMonth()    === today.getMonth()    &&
    date.getFullYear() === today.getFullYear();

  const time = date.toLocaleTimeString("en-US", {
    hour: "numeric", minute: "2-digit",
  });

  return isToday
    ? `Today, ${time}`
    : `${date.toLocaleDateString("en-US", { month: "short", day: "numeric" })}, ${time}`;
}
