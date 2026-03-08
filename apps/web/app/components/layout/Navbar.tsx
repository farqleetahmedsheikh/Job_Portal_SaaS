/** @format */
"use client";

import { User } from "../../types/user";
import { Avatar } from "../ui/Avatar";
import { ThemeToggle } from "../theme/ThemeToggler";
import Link from "next/link";
import styles from "../../styles/navbar.module.css";

interface Props {
  user: User;
}

export const Navbar = ({ user }: Props) => {
  const placeholder =
    user.role === "APPLICANT" ? "Search jobs..." : "Search candidates...";

  return (
    <header className={styles.navbar}>
      {/* Logo */}
      <Link href="/" className={styles.logo}>
        {/* <div className={styles["logo-mark"]}>
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="m21 21-4.35-4.35" />
          </svg>
        </div> */}
        <span className={styles["logo-text"]}>
          Hire<span>Sphere</span>
        </span>
      </Link>

      {/* Search
      <div className={styles["search-wrap"]}>
        <svg
          className={styles["search-icon"]}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.35-4.35" />
        </svg>
        <input className={styles.search} placeholder={placeholder} />
      </div> */}

      {/* Right actions */}
      <div className={styles.right}>
        {/* Notifications */}
        <button className={styles["icon-btn"]} aria-label="Notifications">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
          <span className={styles.dot} />
        </button>

        <ThemeToggle />

        <div className={styles.divider} />

        {/* User pill */}
        <Link href="/profile" className={styles["user-pill"]}>
          <Avatar name={user.fullName} src={user.avatar} />
          <div className={styles["user-meta"]}>
            <span className={styles["user-name"]}>{user.fullName}</span>
            <span className={styles["user-role"]}>
              {user.role.charAt(0) + user.role.slice(1).toLowerCase()}
            </span>
          </div>
          <svg
            className={styles.chevron}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
        </Link>
      </div>
    </header>
  );
};
