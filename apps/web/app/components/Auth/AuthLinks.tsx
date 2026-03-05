/** @format */

"use client";

import React from "react";
import Link from "next/link";

interface AuthLinksProps {
  /** Optional text for "Don't have an account?" section */
  leftLinkText?: string;
  leftLinkHref?: string;
  /** Optional text for "Forgot password?" link */
  rightLinkText?: string;
  rightLinkHref?: string;
  className?: string;
}

export const AuthLinks: React.FC<AuthLinksProps> = ({
  leftLinkText = "",
  leftLinkHref = "",
  rightLinkText = "",
  rightLinkHref = "",
  className = "",
}) => {
  return (
    <div
      className={`${className}`}
      style={{ display: "flex", justifyContent: "space-between", marginTop: "1rem", marginBottom: "1rem" }}
    >
      {leftLinkText && { leftLinkText } && (
        <Link href={leftLinkHref}>{leftLinkText}</Link>
      )}

      {rightLinkText && <Link href={rightLinkHref}>{rightLinkText}</Link>}
    </div>
  );
};
