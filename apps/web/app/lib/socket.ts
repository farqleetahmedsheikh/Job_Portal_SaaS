/** @format */

import { API_BASE } from "../constants";

export function apiOriginFromBase(apiBase = API_BASE): string {
  try {
    const url = new URL(apiBase);
    return url.origin;
  } catch {
    return apiBase.replace(/\/api\/?$/, "").replace(/\/$/, "");
  }
}

export const SOCKET_ORIGIN = apiOriginFromBase();
export const SOCKET_SERVER_ORIGIN =
  process.env.NEXT_PUBLIC_SOCKET_URL?.replace(/\/$/, "") ?? SOCKET_ORIGIN;
