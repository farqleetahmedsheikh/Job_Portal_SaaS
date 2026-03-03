/** @format */

import "../../styles/auth.css";

export default function RoleSelectionPage() {
  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        <h1>Select your role</h1>
        <p className="auth-subtitle">You can’t change this later</p>

        <div className="role-grid">
          <a href="/complete-profile?role=applicant" className="role-card">
            <h3>Applicant</h3>
            <p>Find jobs, apply, interview</p>
          </a>

          <a href="/complete-profile?role=employer" className="role-card">
            <h3>Employer</h3>
            <p>Post jobs, hire talent</p>
          </a>
        </div>
      </div>
    </div>
  );
}
