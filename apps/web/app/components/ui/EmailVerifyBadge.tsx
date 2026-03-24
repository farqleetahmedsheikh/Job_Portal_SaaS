/** @format */
"use client";

import Link from "next/link";
import { ShieldCheck, ShieldAlert } from "lucide-react";
import styles from "../../employer/styles/profile.module.css";

interface Props {
  isVerified: boolean | undefined;
}

export function EmailVerifiedBadge({ isVerified }: Props) {
  if (isVerified) {
    return (
      <span className={`${styles.badge} ${styles["badge-verified"]}`}>
        <ShieldCheck size={11} /> Verified
      </span>
    );
  }

  return (
    <Link
      href="/verify-email"
      className={`${styles.badge} ${styles["badge-unverified"]}`}
      title="Click to verify your email"
    >
      <ShieldAlert size={11} /> Not verified
    </Link>
  );
}
