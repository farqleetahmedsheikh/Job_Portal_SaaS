/** @format */

import "../../styles/forms.css";
import "../../styles/auth.css";
import { Button } from "../../components/ui/Button";

export default function VerifyOTPPage() {
  return (
    <div className="auth-wrapper">
      <form className="auth-card">
        <h1>Verify OTP</h1>
        <p className="auth-subtitle">
          Enter the 6-digit code sent to your email
        </p>

        <div className="form-group">
          <label>OTP</label>
          <input type="number" placeholder="123456" />
        </div>

        <Button variant="primary" type="submit">
          Verify OTP
        </Button>

        <p className="auth-footer">
          Don’t have an account? <a href="/register">Create one</a>
        </p>
      </form>
    </div>
  );
}
