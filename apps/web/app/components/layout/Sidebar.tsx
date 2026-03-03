/** @format */

type Props = { role: "employer" | "applicant" };

export default function Sidebar({ role }: Props) {
  return (
    <aside className="sidebar">
      <h3>HireFlow</h3>

      {role === "employer" && (
        <>
          <a href="/dashboard">Dashboard</a>
          <a href="/jobs">Jobs</a>
          <a href="/applications">Applications</a>
          <a href="/company">Company</a>
        </>
      )}

      {role === "applicant" && (
        <>
          <a href="/jobs">Find Jobs</a>
          <a href="/applications">My Applications</a>
          <a href="/profile">Profile</a>
        </>
      )}
    </aside>
  );
}
