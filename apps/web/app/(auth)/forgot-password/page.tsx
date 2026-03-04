/** @format */

import "../../styles/forms.css";
import "../../styles/auth.css";
import { Button } from "../../components/ui/Button";

export default function ForgotPasswordPage() {
  return (
    <div className="auth-wrapper">
      <form className="auth-card">
        <h1>Forgot Password</h1>
        <p className="auth-subtitle">Enter your email to reset your password</p>

        <div className="form-group">
          <label>Email</label>
          <input type="email" placeholder="you@email.com" />
        </div>

        <Button variant="primary" type="submit">
          Forgot
        </Button>
      </form>
    </div>
  );
}
