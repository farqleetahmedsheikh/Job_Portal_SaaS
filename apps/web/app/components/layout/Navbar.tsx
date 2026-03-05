/** @format */

"use client";

import { User } from "../../types/user";
import { Avatar } from "../ui/Avatar";
import { ThemeToggle } from "../theme/ThemeToggler";
import styles from "../../styles/navbar.module.css";


interface Props {
  user: User;
}

export const Navbar = ({ user }: Props) => {
  return (
    <header className={styles.navbar}>
      <input
        className={styles.search}
        placeholder={
          user.role === "APPLICANT" ? "Search jobs..." : "Search candidates..."
        }
      />

      <div className={styles["navbar-right"]}>
        <ThemeToggle />
        <span className={styles["role-badge"]}>{user.role}</span>
        <Avatar name={user.fullName} src={user.avatar} />
      </div>
    </header>
  );
};
