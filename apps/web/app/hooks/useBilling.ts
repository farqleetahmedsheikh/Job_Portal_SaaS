/** @format */

"use client";

import { useState, useEffect, useCallback } from "react";
import { api } from "../lib";
import { API_BASE } from "../constants";
import type {
  Subscription,
  BillingEvent,
  SubscriptionPlan,
  AddonType,
} from "../types/billing.types";

interface BillingState {
  subscription: Subscription | null;
  history: BillingEvent[];
  loading: boolean;
  error: string | null;
}

export function useBilling() {
  const [state, setState] = useState<BillingState>({
    subscription: null,
    history: [],
    loading: true,
    error: null,
  });

  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  // ── Fetch subscription + history ─────────────────────────────────────────
  const refresh = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const [subscription, history] = await Promise.all([
        api<Subscription>(`${API_BASE}/billing/subscription`, "GET"),
        api<BillingEvent[]>(`${API_BASE}/billing/history`, "GET"),
      ]);
      setState({ subscription, history, loading: false, error: null });
    } catch (err) {
      setState((s) => ({
        ...s,
        loading: false,
        error: err instanceof Error ? err.message : "Failed to load billing",
      }));
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // ── Upgrade / downgrade ───────────────────────────────────────────────────
  const checkout = useCallback(async (plan: SubscriptionPlan) => {
    setCheckoutLoading(true);
    setCheckoutError(null);
    try {
      const { checkoutUrl } = await api<{ checkoutUrl: string }>(
        `${API_BASE}/billing/checkout/${plan}`,
        "POST",
      );
      window.location.href = checkoutUrl;
    } catch (err) {
      setCheckoutError(
        err instanceof Error ? err.message : "Failed to start checkout",
      );
      setCheckoutLoading(false);
    }
  }, []);

  // ── Buy addon ─────────────────────────────────────────────────────────────
  const purchaseAddon = useCallback(async (type: AddonType, jobId?: string) => {
    setCheckoutLoading(true);
    setCheckoutError(null);
    try {
      const { checkoutUrl } = await api<{ checkoutUrl: string }>(
        `${API_BASE}/billing/addon`,
        "POST",
        { type, jobId },
      );
      window.location.href = checkoutUrl;
    } catch (err) {
      setCheckoutError(
        err instanceof Error ? err.message : "Failed to start checkout",
      );
      setCheckoutLoading(false);
    }
  }, []);

  return {
    ...state,
    refresh,
    checkout,
    purchaseAddon,
    checkoutLoading,
    checkoutError,
  };
}
