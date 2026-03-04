/** @format */

"use client";

import { User } from "../../types/user";
import { Avatar } from "../ui/Avatar";
import { ThemeToggle } from "../theme/ThemeToggler";


interface Props {
  user: User;
}

export const Navbar = ({ user }: Props) => {
  return (
    <header className="navbar">
      <input
        className="search"
        placeholder={
          user.role === "APPLICANT" ? "Search jobs..." : "Search candidates..."
        }
      />

      <div className="navbar-right">
        <ThemeToggle />
        <span className="role-badge">{user.role}</span>
        <Avatar name={user.fullName} src={user.avatar} />
      </div>
    </header>
  );
};
