/** @format */

import "../../styles/forms.css";
import "../../styles/auth.css";
import { Button } from "../../components/ui/Button";

export default function LoginPage() {
  return (
    <div className="auth-wrapper">
      <form className="auth-card">
        <h1>Welcome back</h1>
        <p className="auth-subtitle">Sign in to continue</p>

        <div className="form-group">
          <label>Email</label>
          <input type="email" placeholder="you@email.com" />
        </div>

        <div className="form-group">
          <label>Password</label>
          <input type="password" placeholder="••••••••" />
        </div>

        <Button variant="primary" type="submit">
          Login
        </Button>

        <p className="auth-footer">
          Don’t have an account? <a href="/register">Create one</a>
        </p>
      </form>
    </div>
  );
}
