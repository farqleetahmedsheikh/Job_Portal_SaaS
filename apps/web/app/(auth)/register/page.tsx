/** @format */

import { Button } from "../../components/ui/Button";
import "../../styles/auth.css";
import "../../styles/forms.css";

export default function RegisterPage() {
  return (
    <div className="auth-wrapper">
      <form className="auth-card">
        <h1>Create account</h1>
        <p className="auth-subtitle">Start hiring or find your next job</p>

        <div className="form-group">
          <label>Full name</label>
          <input type="text" placeholder="John Doe" />
        </div>

        <div className="form-group">
          <label>Email</label>
          <input type="email" placeholder="you@email.com" />
        </div>

        <div className="form-group">
          <label>Password</label>
          <input type="password" placeholder="Minimum 8 characters" />
        </div>

        <Button type="submit">
          Register
        </Button>

        <p className="auth-footer">
          Already have an account? <a href="/login">Login</a>
        </p>
      </form>
    </div>
  );
}
