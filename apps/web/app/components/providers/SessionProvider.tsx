/** @format */
"use client";

import { useEffect } from "react";
import { useSession } from "../../hooks/useSession";
import { useSessionStore } from "../../store/session.store";

// Drop this in your root layout, inside ThemeProvider
export function SessionProvider({ children }: { children: React.ReactNode }) {
  const { hydrate } = useSession();
  const isHydrated = useSessionStore((s) => s.isHydrated);

  useEffect(() => {
    hydrate(); // Re-validates cookie on every hard refresh
  }, [hydrate]);

  // Prevent flash of unauthenticated content
  if (!isHydrated) return null;

  return <>{children}</>;
}
