/** @format */

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { API_BASE } from "../constants";
import type { User } from "../types/user.types";
import { normalizeSessionUser, type RawSessionUser } from "./session";

export async function getCurrentUser(): Promise<User> {
  const token = (await cookies()).get("token")?.value;
  if (!token) redirect("/login");

  const res = await fetch(`${API_BASE.replace(/\/$/, "")}/auth/me`, {
    cache: "no-store",
    headers: {
      Cookie: `token=${encodeURIComponent(token)}`,
      Accept: "application/json",
    },
  });

  if (res.status === 401) redirect("/login?reason=expired");
  if (!res.ok) redirect("/login");

  return normalizeSessionUser((await res.json()) as RawSessionUser);
}
