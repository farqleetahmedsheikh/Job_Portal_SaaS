/** @format */
import { Card } from "../../components/ui/Card";
import styles from "../../styles/applicant.module.css";
export default function EmployerPage() {
  return (
    <div className={styles.grid}>
      <Card title="Applications" value="24 Active" icon="briefcase" />
      <Card title="Active Jobs" value="8 Open Positions" icon="briefcase" />
      <Card title="Total Applicants" value="124 Candidates" icon="users" />
      <Card title="Interviews" value="16 Scheduled" icon="calendar" />
    </div>
  );
}
