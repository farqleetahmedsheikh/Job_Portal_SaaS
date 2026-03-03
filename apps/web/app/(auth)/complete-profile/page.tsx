/** @format */

import "../../styles/auth.css";
import "../../styles/forms.css";
import { Button } from "../../components/ui/Button";

export default function CompleteProfilePage() {
  return (
    <div className="auth-wrapper">
      <form className="auth-card">
        <h1>Complete your profile</h1>
        <p className="auth-subtitle">
          This helps us personalize your experience
        </p>

        {/* Applicant fields */}
        <div className="form-group">
          <label>Job title</label>
          <input type="text" placeholder="Frontend Developer" />
        </div>

        <div className="form-group">
          <label>Experience (years)</label>
          <input type="number" placeholder="2" />
        </div>

        {/* Employer fields (conditional in real app) */}
        <div className="form-group">
          <label>Company name</label>
          <input type="text" placeholder="Tech Pvt Ltd" />
        </div>

        <Button type="submit">Continue to Dashboard</Button>
      </form>
    </div>
  );
}
