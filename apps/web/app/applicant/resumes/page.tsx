/** @format */
"use client";

import { useRef, useState } from "react";
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
import { useResumes } from "../../hooks/useResumes";
import styles from "../styles/resumes.module.css";

const MAX = 5;

// ─── Card ─────────────────────────────────────────────────────────────────────

function ResumeCard({
  resume,
  onDelete,
  onSetDefault,
  canDelete,
}: {
  resume: import("../../types/resumes.types").Resume;
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
          <p className={styles.cardName}>{resume.originalName}</p>
          <div className={styles.cardMeta}>
            <span>
              <Clock size={10} />{" "}
              {new Date(resume.uploadedAt).toLocaleDateString("en-PK", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </span>
            <span>{(resume.fileSize / 1024).toFixed(0)} KB</span>
            {(resume.usedIn ?? 0) > 0 && (
              <span className={styles.usedIn}>
                <FileCheck size={10} /> {resume.usedIn} application
                {resume.usedIn !== 1 ? "s" : ""}
              </span>
            )}
          </div>
          <div className={styles.statusRow}>
            <span className={styles.statusReady}>
              <CheckCircle2 size={10} /> Ready
            </span>
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
        <a
          href={resume.fileUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={styles.actionBtn}
          title="Preview"
        >
          <Eye size={14} />
        </a>
        <a
          href={resume.fileUrl}
          download={resume.originalName}
          className={styles.actionBtn}
          title="Download"
        >
          <Download size={14} />
        </a>

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

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ResumesPage() {
  const {
    resumes,
    loading,
    error,
    upload,
    uploadResume,
    setDefault,
    deleteResume,
    resetUpload,
  } = useResumes();

  const [dragging, setDragging] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const canUpload = resumes.length < MAX;
  const totalApps = resumes.reduce((a, r) => a + (r.usedIn ?? 0), 0);

  // derive toast from upload status
  const toast =
    upload.status === "success"
      ? "Resume uploaded successfully"
      : upload.status === "error"
        ? upload.error
        : "";

  function handleFiles(file: File) {
    if (!canUpload || upload.status === "uploading") return;
    if (!file.name.match(/\.(pdf|doc|docx)$/i))
      return alert("Only PDF / DOC / DOCX files are accepted.");
    if (file.size > 5 * 1024 * 1024) return alert("File must be under 5 MB.");
    uploadResume(file);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFiles(file);
  }

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.header}>
          <div className={styles.skeletonTitle} />
        </div>
        <div className={styles.list}>
          {[1, 2, 3].map((n) => (
            <div key={n} className={styles.skeletonCard} />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.page}>
        <div className={styles.limitBanner}>
          <AlertTriangle size={14} /> {error}
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Resume Manager</h1>
          <p className={styles.subtitle}>
            {resumes.length} / {MAX} resumes · used in {totalApps} application
            {totalApps !== 1 ? "s" : ""}
          </p>
        </div>
        {canUpload && (
          <button
            className={`${styles.btn} ${styles.btnPrimary}`}
            onClick={() => fileRef.current?.click()}
            disabled={upload.status === "uploading"}
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
            e.target.value = "";
          }}
        />
      </div>

      {/* Toast */}
      {toast && (
        <div
          className={
            upload.status === "error" ? styles.limitBanner : styles.toast
          }
          role="status"
          style={{ cursor: upload.status === "error" ? "pointer" : undefined }}
          onClick={upload.status === "error" ? resetUpload : undefined}
        >
          {upload.status === "error" ? (
            <>
              <AlertTriangle size={13} /> {toast}{" "}
              <span style={{ marginLeft: "auto", fontSize: 11 }}>
                ✕ Dismiss
              </span>
            </>
          ) : (
            <>
              <CheckCircle2 size={13} /> {toast}
            </>
          )}
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

      {/* Drop zone / limit banner */}
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
            {upload.status === "uploading"
              ? `Uploading… ${upload.progress}%`
              : dragging
                ? "Release to upload"
                : "Drag & drop your resume here"}
          </p>
          {upload.status === "uploading" ? (
            <div style={{ width: "100%", maxWidth: 280, margin: "8px auto 0" }}>
              <div
                style={{ height: 3, background: "#e8e2dc", borderRadius: 2 }}
              >
                <div
                  style={{
                    height: "100%",
                    width: `${upload.progress}%`,
                    background: "#c8922a",
                    borderRadius: 2,
                    transition: "width .2s",
                  }}
                />
              </div>
            </div>
          ) : (
            <p className={styles.dropSub}>
              or <span>click to browse</span> · PDF, DOC, DOCX · Max 5 MB
            </p>
          )}
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
              onDelete={deleteResume}
              onSetDefault={setDefault}
              canDelete={resumes.length > 1}
            />
          ))
        )}
      </div>
    </div>
  );
}
