/** @format */

import { Card } from "../../components/ui/Card";
import styles from "../../styles/applicant.module.css";

export default function ApplicantPage() {
  return (
    <div className={styles.grid}>
      <Card title="Applications" value="24 Active" icon="briefcase" />
      <Card title="Interviews" value="5 Scheduled" />
      <Card title="Saved Jobs" value="12 Saved" icon="bookmark" />
      <Card title="Profile Strength" value="85%" icon="user">
        <span>Complete your profile to reach 100%</span>
      </Card>
    </div>
  );
}
