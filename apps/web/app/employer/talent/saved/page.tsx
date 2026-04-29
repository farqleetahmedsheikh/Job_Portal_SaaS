/** @format */
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, BookmarkCheck, Search } from "lucide-react";
import { api } from "../../../lib";
import { API_BASE } from "../../../constants";
import styles from "../talent.module.css";

type SavedCandidate = {
  userId: string;
  fullName: string;
  headline: string | null;
  skills: string[];
  location: string | null;
  profileCompleteness: number;
};

export default function SavedTalentPage() {
  const [items, setItems] = useState<SavedCandidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api<{ data: SavedCandidate[] }>(`${API_BASE}/talent-db/saved`, "GET")
      .then((res) => setItems(res.data))
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Failed to load saved candidates"),
      )
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className={styles.page}>
      <section className={styles.header}>
        <div>
          <span className={styles.kicker}>Talent Database</span>
          <h1>Saved Candidates</h1>
          <p>Keep promising candidates close for future hiring conversations.</p>
        </div>
        <Link href="/employer/talent" className={styles.btnGhost}>
          <ArrowLeft size={15} /> Back to talent database
        </Link>
      </section>

      <section className={styles.grid}>
        {loading
          ? Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className={styles.skeleton} />
            ))
          : error
            ? <div className={styles.empty}>{error}</div>
            : items.length
              ? items.map((candidate) => (
                  <article key={candidate.userId} className={styles.candidate}>
                    <div className={styles.top}>
                      <span className={styles.avatar}>
                        {candidate.fullName
                          .split(/\s+/)
                          .map((part) => part[0])
                          .slice(0, 2)
                          .join("")
                          .toUpperCase()}
                      </span>
                      <div className={styles.identity}>
                        <h2>{candidate.fullName}</h2>
                        <p>{candidate.headline ?? "Applicant"}</p>
                      </div>
                    </div>
                    <div className={styles.badgeRow}>
                      <span className={styles.badge}>
                        <BookmarkCheck size={12} /> Saved
                      </span>
                    </div>
                    <div className={styles.meta}>
                      <span>{candidate.location ?? "Location not set"}</span>
                    </div>
                    <div className={styles.skills}>
                      {candidate.skills.slice(0, 5).map((skill) => (
                        <span key={skill} className={styles.skill}>
                          {skill}
                        </span>
                      ))}
                    </div>
                    <div className={styles.strength}>
                      <div className={styles.strengthTop}>
                        <span>Profile strength</span>
                        <strong>{candidate.profileCompleteness}%</strong>
                      </div>
                      <div className={styles.track}>
                        <span style={{ width: `${candidate.profileCompleteness}%` }} />
                      </div>
                    </div>
                  </article>
                ))
              : (
                  <div className={styles.empty}>
                    <span className={styles.emptyIcon}>
                      <Search size={20} />
                    </span>
                    <h2>No saved candidates yet</h2>
                    <p>Save candidates from the Talent Database to build a shortlist.</p>
                    <Link href="/employer/talent" className={styles.btnPrimary}>
                      Browse candidates
                    </Link>
                  </div>
                )}
      </section>
    </div>
  );
}
