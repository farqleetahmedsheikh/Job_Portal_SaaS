/** @format */

import Link from "next/link";

export default function Home() {
  return (
    <main className="auth-layout">
      <div className="auth-card">
        <h1>Welcome to HireFlow</h1>
        <p className="text-muted">
          Find jobs or hire talent — all in one place.
        </p>

        <div className="auth-actions">
          <Link href="/login" className="btn-primary">
            Login
          </Link>

          <Link href="/register" className="btn-secondary">
            Create Account
          </Link>
        </div>
      </div>
    </main>
  );
}
