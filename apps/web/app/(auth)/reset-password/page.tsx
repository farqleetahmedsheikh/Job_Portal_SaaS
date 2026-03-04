/** @format */

import "../../styles/forms.css";
import "../../styles/auth.css";
import { Button } from "../../components/ui/Button";

export default function ResetPasswordPage() {
  return (
    <div className="auth-wrapper">
      <form className="auth-card">
        <h1>Reset Password</h1>
        <p className="auth-subtitle">Enter your new password below</p>

        <div className="form-group">
          <label>Password</label>
          <input type="password" placeholder="••••••••" />
        </div>
        <div className="form-group">
          <label>Confirm Password</label>
          <input type="password" placeholder="••••••••" />
        </div>

        <Button variant="primary" type="submit">
          Reset Password
        </Button>

        <p className="auth-footer">
          Don’t have an account? <a href="/register">Create one</a>
        </p>
      </form>
    </div>
  );
}
