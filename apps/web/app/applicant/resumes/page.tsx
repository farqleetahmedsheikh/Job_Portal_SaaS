/** @format */
"use client";

import { useState, useRef } from "react";
import {
  Upload,
  FileText,
  Trash2,
  Star,
  StarOff,
  Download,
  Eye,
  Plus,
  CheckCircle2,
  AlertTriangle,
  Clock,
  FileCheck,
} from "lucide-react";
import styles from "../../styles/resumes.module.css";

type ResumeStatus = "ready" | "processing" | "error";

interface Resume {
  id: string;
  name: string;
  size: string;
  uploaded: string;
  isDefault: boolean;
  status: ResumeStatus;
  usedIn: number;
}

const INITIAL: Resume[] = [
  {
    id: "1",
    name: "Resume_2026.pdf",
    size: "342 KB",
    uploaded: "Mar 1, 2026",
    isDefault: true,
    status: "ready",
    usedIn: 8,
  },
  {
    id: "2",
    name: "Resume_Stripe_Custom.pdf",
    size: "289 KB",
    uploaded: "Feb 20, 2026",
    isDefault: false,
    status: "ready",
    usedIn: 3,
  },
  {
    id: "3",
    name: "Resume_Frontend_Lead.pdf",
    size: "310 KB",
    uploaded: "Feb 10, 2026",
    isDefault: false,
    status: "ready",
    usedIn: 1,
  },
];

const MAX = 5;

function ResumeCard({
  resume,
  onDelete,
  onSetDefault,
  canDelete,
}: {
  resume: Resume;
  onDelete: (id: string) => void;
  onSetDefault: (id: string) => void;
  canDelete: boolean;
}) {
  const [confirm, setConfirm] = useState(false);

  return (
    <div
      className={`${styles.card} ${resume.isDefault ? styles.cardDefault : ""}`}
    >
      {resume.isDefault && (
        <span className={styles.defaultBadge}>
          <Star size={9} /> Default
        </span>
      )}

      <div className={styles.cardLeft}>
        <div className={styles.fileIconWrap}>
          <FileText size={20} />
          <span className={styles.fileExt}>PDF</span>
        </div>

        <div className={styles.cardInfo}>
          <p className={styles.cardName}>{resume.name}</p>
          <div className={styles.cardMeta}>
            <span>
              <Clock size={10} /> {resume.uploaded}
            </span>
            <span>{resume.size}</span>
            {resume.usedIn > 0 && (
              <span className={styles.usedIn}>
                <FileCheck size={10} /> {resume.usedIn} application
                {resume.usedIn !== 1 ? "s" : ""}
              </span>
            )}
          </div>
          <div className={styles.statusRow}>
            {resume.status === "ready" && (
              <span className={styles.statusReady}>
                <CheckCircle2 size={10} /> Ready
              </span>
            )}
            {resume.status === "processing" && (
              <span className={styles.statusProcessing}>
                <Clock size={10} /> Processing…
              </span>
            )}
            {resume.status === "error" && (
              <span className={styles.statusError}>
                <AlertTriangle size={10} /> Upload failed
              </span>
            )}
          </div>
        </div>
      </div>

      <div className={styles.cardActions}>
        {!resume.isDefault && (
          <button
            className={styles.actionBtn}
            title="Set as default"
            onClick={() => onSetDefault(resume.id)}
          >
            <StarOff size={14} />
          </button>
        )}
        <button className={styles.actionBtn} title="Preview">
          <Eye size={14} />
        </button>
        <button className={styles.actionBtn} title="Download">
          <Download size={14} />
        </button>

        {canDelete && !confirm && (
          <button
            className={`${styles.actionBtn} ${styles.actionBtnDanger}`}
            title="Delete"
            onClick={() => setConfirm(true)}
          >
            <Trash2 size={14} />
          </button>
        )}
        {confirm && (
          <div className={styles.deleteConfirm}>
            <span>Delete?</span>
            <button
              className={styles.confirmYes}
              onClick={() => onDelete(resume.id)}
            >
              Yes
            </button>
            <button
              className={styles.confirmNo}
              onClick={() => setConfirm(false)}
            >
              No
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ResumesPage() {
  const [resumes, setResumes] = useState<Resume[]>(INITIAL);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [toast, setToast] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  };

  const handleFiles = (file: File) => {
    if (resumes.length >= MAX) return;
    setUploading(true);
    const newResume: Resume = {
      id: Date.now().toString(),
      name: file.name.endsWith(".pdf") ? file.name : `${file.name}.pdf`,
      size: `${Math.round(file.size / 1024)} KB`,
      uploaded: "Just now",
      isDefault: resumes.length === 0,
      status: "processing",
      usedIn: 0,
    };
    setResumes((p) => [newResume, ...p]);
    setTimeout(() => {
      setResumes((p) =>
        p.map((r) => (r.id === newResume.id ? { ...r, status: "ready" } : r)),
      );
      setUploading(false);
      showToast("Resume uploaded successfully");
    }, 1800);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFiles(file);
  };

  const handleDelete = (id: string) => {
    const resume = resumes.find((r) => r.id === id);
    setResumes((p) => {
      const next = p.filter((r) => r.id !== id);
      if (resume?.isDefault && next.length > 0) next[0].isDefault = true;
      return next;
    });
    showToast("Resume deleted");
  };

  const handleSetDefault = (id: string) =>
    setResumes((p) => p.map((r) => ({ ...r, isDefault: r.id === id })));

  const canUpload = resumes.length < MAX;
  const totalApps = resumes.reduce((a, r) => a + r.usedIn, 0);

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Resume Manager</h1>
          <p className={styles.subtitle}>
            {resumes.length} / {MAX} resumes · used in {totalApps} applications
          </p>
        </div>
        {canUpload && (
          <button
            className={`${styles.btn} ${styles.btnPrimary}`}
            onClick={() => fileRef.current?.click()}
          >
            <Plus size={14} /> Upload resume
          </button>
        )}
        <input
          ref={fileRef}
          type="file"
          accept=".pdf,.doc,.docx"
          style={{ display: "none" }}
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFiles(f);
          }}
        />
      </div>

      {/* Toast */}
      {toast && (
        <div className={styles.toast} role="status">
          <CheckCircle2 size={13} /> {toast}
        </div>
      )}

      {/* Stat pills */}
      <div className={styles.statRow}>
        {[
          { label: "Total resumes", val: resumes.length },
          { label: "Slots remaining", val: MAX - resumes.length },
          { label: "Apps covered", val: totalApps },
        ].map((s) => (
          <div key={s.label} className={styles.statPill}>
            <span className={styles.statVal}>{s.val}</span>
            <span className={styles.statLabel}>{s.label}</span>
          </div>
        ))}
      </div>

      {/* Drop zone */}
      {canUpload ? (
        <div
          className={`${styles.dropZone} ${dragging ? styles.dropZoneActive : ""}`}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileRef.current?.click()}
        >
          <div
            className={`${styles.dropIcon} ${dragging ? styles.dropIconActive : ""}`}
          >
            <Upload size={22} />
          </div>
          <p className={styles.dropTitle}>
            {dragging ? "Release to upload" : "Drag & drop your resume here"}
          </p>
          <p className={styles.dropSub}>
            or <span>click to browse</span> · PDF, DOC, DOCX · Max 5 MB
          </p>
          <span className={styles.dropLimit}>
            {MAX - resumes.length} upload{MAX - resumes.length !== 1 ? "s" : ""}{" "}
            remaining
          </span>
        </div>
      ) : (
        <div className={styles.limitBanner}>
          <AlertTriangle size={14} />
          Maximum of {MAX} resumes reached. Delete one to upload a new version.
        </div>
      )}

      {/* Tips */}
      <div className={styles.tipsCard}>
        <p className={styles.tipsTitle}>💡 Tips for a stronger resume</p>
        <div className={styles.tipsGrid}>
          {[
            "Keep it to 1–2 pages",
            "Use keywords from the job description",
            "Tailor a version for each role",
            "Quantify achievements where possible",
          ].map((t) => (
            <span key={t} className={styles.tip}>
              <CheckCircle2
                size={11}
                style={{ color: "var(--status-success)", flexShrink: 0 }}
              />
              {t}
            </span>
          ))}
        </div>
      </div>

      {/* List */}
      <div className={styles.list}>
        {resumes.length === 0 ? (
          <div className={styles.empty}>
            <FileText
              size={32}
              style={{ color: "var(--text-muted)", marginBottom: 12 }}
            />
            <p>No resumes yet</p>
            <span>Upload your resume to start applying to jobs</span>
          </div>
        ) : (
          resumes.map((r) => (
            <ResumeCard
              key={r.id}
              resume={r}
              onDelete={handleDelete}
              onSetDefault={handleSetDefault}
              canDelete={resumes.length > 1}
            />
          ))
        )}
      </div>
    </div>
  );
}
