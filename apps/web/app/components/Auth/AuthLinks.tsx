/** @format */
"use client";

import React from "react";
import Link from "next/link";
import styles from "../../styles/auth.module.css";

interface AuthLinksProps {
  leftLinkText?: string;
  leftLinkHref?: string;
  rightLinkText?: string;
  rightLinkHref?: string;
}

export const AuthLinks: React.FC<AuthLinksProps> = ({
  leftLinkText = "",
  leftLinkHref = "",
  rightLinkText = "",
  rightLinkHref = "",
}) => (
  <div className={styles.links}>
    {leftLinkText && (
      <Link href={leftLinkHref} className={styles.link}>
        {leftLinkText}
      </Link>
    )}
    {rightLinkText && (
      <Link href={rightLinkHref} className={styles["link-accent"]}>
        {rightLinkText}
      </Link>
    )}
  </div>
);
