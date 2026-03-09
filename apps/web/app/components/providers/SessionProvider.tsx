/** @format */

"use client";

import { useEffect, useRef } from "react";
import { useSession } from "../../hooks/useSession";
import { useSessionStore } from "../../store/session.store";

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const { hydrate } = useSession();
  const { state } = useSessionStore(); // ← Context version returns { state, ... }
  const hasMounted = useRef(false);

  useEffect(() => {
    if (!hasMounted.current) {
      hasMounted.current = true;
      void hydrate();
    }
  }, [hydrate]);

  // Don't block render — prevents flash-to-login on /complete-profile
  return <>{children}</>;
}
