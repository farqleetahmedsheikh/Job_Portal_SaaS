/** @format */
"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck, Mail, RefreshCw, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useUser, useSessionStore } from "../../store/session.store";
import { api } from "../../lib";
import { API_BASE } from "../../constants";
import type { SessionUser } from "../../store/session.store";
import styles from "../../styles/verify-email.module.css";

const OTP_LENGTH = 6;
const RESEND_COOLDOWN = 60; // seconds

export default function VerifyEmailPage() {
  const router = useRouter();
  const user = useUser();
  const { setUser } = useSessionStore();

  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const [step, setStep] = useState<"send" | "verify" | "done">("send");
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Redirect if already verified
  useEffect(() => {
    if (user?.isEmailVerified) router.replace("/applicant/profile");
  }, [user, router]);

  // Cooldown timer
  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  // ── Send OTP ───────────────────────────────────────────────────────────────
  const handleSend = useCallback(async () => {
    setSending(true);
    setError(null);
    try {
      await api(`${API_BASE}/auth/send-verification-otp`, "POST");
      setStep("verify");
      setCooldown(RESEND_COOLDOWN);
      // Focus first input after render
      setTimeout(() => inputRefs.current[0]?.focus(), 100);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send OTP");
    } finally {
      setSending(false);
    }
  }, []);

  // ── OTP input ──────────────────────────────────────────────────────────────
  const handleOtpChange = useCallback((i: number, val: string) => {
    const digit = val.replace(/\D/, "").slice(-1);
    setOtp((prev) => {
      const next = [...prev];
      next[i] = digit;
      return next;
    });
    setError(null);
    if (digit && i < OTP_LENGTH - 1) {
      inputRefs.current[i + 1]?.focus();
    }
  }, []);

  const handleOtpKeyDown = useCallback(
    (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Backspace" && !otp[i] && i > 0) {
        inputRefs.current[i - 1]?.focus();
      }
    },
    [otp],
  );

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    e.preventDefault();
    const digits = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, OTP_LENGTH);
    setOtp((prev) => {
      const next = [...prev];
      digits.split("").forEach((d, i) => {
        next[i] = d;
      });
      return next;
    });
    // Focus last filled or next empty
    const lastIdx = Math.min(digits.length, OTP_LENGTH - 1);
    inputRefs.current[lastIdx]?.focus();
  }, []);

  // ── Verify OTP ─────────────────────────────────────────────────────────────
  const handleVerify = useCallback(async () => {
    const code = otp.join("");
    if (code.length < OTP_LENGTH) {
      setError("Please enter all 6 digits");
      return;
    }
    setVerifying(true);
    setError(null);
    try {
      const updated = await api<SessionUser>(
        `${API_BASE}/auth/verify-email-otp`,
        "POST",
        { otp: code },
      );
      setUser(updated);
      setStep("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid or expired code");
      // Clear OTP on failure
      setOtp(Array(OTP_LENGTH).fill(""));
      inputRefs.current[0]?.focus();
    } finally {
      setVerifying(false);
    }
  }, [otp, setUser]);

  const role = user?.role ?? "applicant";
  const profileHref = `/${role}/profile`;
  const email = user?.email ?? "";

  // ── Done ───────────────────────────────────────────────────────────────────
  if (step === "done") {
    return (
      <div className={styles.page}>
        <div className={styles.card}>
          <div className={styles.successIcon}>
            <ShieldCheck size={32} />
          </div>
          <h1 className={styles.title}>Email verified!</h1>
          <p className={styles.sub}>
            Your email address has been successfully verified.
          </p>
          <Link
            href={profileHref}
            className={`${styles.btn} ${styles.btnPrimary}`}
          >
            Back to profile
          </Link>
        </div>
      </div>
    );
  }

  // ── Verify step ────────────────────────────────────────────────────────────
  if (step === "verify") {
    return (
      <div className={styles.page}>
        <div className={styles.card}>
          <div className={styles.icon}>
            <Mail size={28} />
          </div>
          <h1 className={styles.title}>Check your inbox</h1>
          <p className={styles.sub}>
            We sent a 6-digit code to <strong>{email}</strong>.<br />
            Enter it below to verify your email.
          </p>

          {error && <p className={styles.error}>{error}</p>}

          {/* OTP inputs */}
          <div className={styles.otpRow} onPaste={handlePaste}>
            {otp.map((digit, i) => (
              <input
                key={i}
                ref={(el) => {
                  inputRefs.current[i] = el;
                }}
                className={`${styles.otpInput} ${error ? styles.otpError : ""}`}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleOtpChange(i, e.target.value)}
                onKeyDown={(e) => handleOtpKeyDown(i, e)}
                autoComplete="one-time-code"
              />
            ))}
          </div>

          <button
            className={`${styles.btn} ${styles.btnPrimary}`}
            onClick={handleVerify}
            disabled={verifying || otp.join("").length < OTP_LENGTH}
            aria-busy={verifying}
          >
            {verifying ? (
              <>
                <span className={styles.spinner} /> Verifying...
              </>
            ) : (
              "Verify email"
            )}
          </button>

          {/* Resend */}
          <div className={styles.resendRow}>
            <span className={styles.resendLabel}>Didn&apos;t receive it?</span>
            {cooldown > 0 ? (
              <span className={styles.cooldown}>
                <RefreshCw size={11} /> Resend in {cooldown}s
              </span>
            ) : (
              <button
                className={styles.resendBtn}
                onClick={handleSend}
                disabled={sending}
              >
                {sending ? "Sending..." : "Resend code"}
              </button>
            )}
          </div>

          <Link href={profileHref} className={styles.backLink}>
            <ArrowLeft size={13} /> Back to profile
          </Link>
        </div>
      </div>
    );
  }

  // ── Send step (initial) ────────────────────────────────────────────────────
  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.icon}>
          <Mail size={28} />
        </div>
        <h1 className={styles.title}>Verify your email</h1>
        <p className={styles.sub}>
          We&apos;ll send a 6-digit code to <strong>{email}</strong> to confirm your
          email address.
        </p>

        {error && <p className={styles.error}>{error}</p>}

        <button
          className={`${styles.btn} ${styles.btnPrimary}`}
          onClick={handleSend}
          disabled={sending}
          aria-busy={sending}
        >
          {sending ? (
            <>
              <span className={styles.spinner} /> Sending...
            </>
          ) : (
            <>
              <Mail size={14} /> Send verification code
            </>
          )}
        </button>

        <Link href={profileHref} className={styles.backLink}>
          <ArrowLeft size={13} /> Back to profile
        </Link>
      </div>
    </div>
  );
}
