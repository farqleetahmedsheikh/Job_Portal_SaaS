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
    window.location.href = "/login?reason=expired";
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
