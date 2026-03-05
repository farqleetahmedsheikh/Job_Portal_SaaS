/** @format */

"use client";

import React from "react";
import { useRouter } from "next/navigation";
import "../../styles/auth.css";

export default function RoleSelectionPage() {
  const router = useRouter();

  const handleRoleSelect = (role: "APPLICANT" | "EMPLOYER") => {
    // Redirect to Complete Profile page with selected role
    router.push(`/complete-profile?role=${role.toLowerCase()}`);
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        <h1>Select Your Role</h1>
        <p className="auth-subtitle">You can’t change this later</p>

        <div className="role-grid">
          <div
            className="role-card"
            onClick={() => handleRoleSelect("APPLICANT")}
            style={{ cursor: "pointer" }}
          >
            <h3>Applicant</h3>
            <p>Find jobs, apply, interview</p>
          </div>

          <div
            className="role-card"
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
