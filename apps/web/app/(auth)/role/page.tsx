/** @format */

"use client";

import React from "react";
import { useRouter } from "next/navigation";
import styles from "../../styles/auth.module.css";

export default function RoleSelectionPage() {
  const router = useRouter();

  const handleRoleSelect = (role: "APPLICANT" | "EMPLOYER") => {
    // Redirect to Complete Profile page with selected role
    router.push(`/complete-profile?role=${role.toLowerCase()}`);
  };

  return (
    <div className={styles["auth-wrapper"]}>
      <div className={styles["auth-card"]}>
        <h1>Select Your Role</h1>
        <p className={styles["auth-subtitle"]}>You can’t change this later</p>

        <div className={styles["role-grid"]}>
          <div
            className={styles["role-card"]}
            onClick={() => handleRoleSelect("APPLICANT")}
            style={{ cursor: "pointer" }}
          >
            <h3>Applicant</h3>
            <p>Find jobs, apply, interview</p>
          </div>

          <div
            className={styles["role-card"]}
            onClick={() => handleRoleSelect("EMPLOYER")}
            style={{ cursor: "pointer" }}
          >
            <h3>Employer</h3>
            <p>Post jobs, hire talent</p>
          </div>
        </div>
      </div>
    </div>
  );
}
