/** @format */
import { useState, useEffect, useCallback } from "react";
import { api } from "../lib";
import { API_BASE } from "../constants";
import type { Resume, UploadState } from "../types/resumes.types";

export function useResumes() {
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [upload, setUpload] = useState<UploadState>({
    status: "idle",
    progress: 0,
    error: null,
  });

  // ── Fetch ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    api<Resume[]>(`${API_BASE}/resumes`, "GET")
      .then((data) => {
        console.log("Resumes Data------->", data);
        if (!cancelled) {
          setResumes(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err.message);
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  // ── Upload ─────────────────────────────────────────────────────────────────
  const uploadResume = useCallback(
    async (file: File) => {
      if (upload.status === "uploading") return;

      setUpload({ status: "uploading", progress: 0, error: null });

      const formData = new FormData();
      formData.append("file", file);

      try {
        // Use XMLHttpRequest so we get real upload progress
        const newResume = await new Promise<Resume>((resolve, reject) => {
          const xhr = new XMLHttpRequest();

          xhr.upload.onprogress = (e) => {
            if (e.lengthComputable) {
              setUpload((u) => ({
                ...u,
                progress: Math.round((e.loaded / e.total) * 100),
              }));
            }
          };

          xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              resolve(JSON.parse(xhr.responseText) as Resume);
            } else {
              reject(new Error(xhr.statusText || "Upload failed"));
            }
          };

          xhr.onerror = () => reject(new Error("Network error"));

          xhr.withCredentials = true;
          xhr.open("POST", `${API_BASE}/resumes/upload`);
          xhr.send(formData);
        });

        setResumes((prev) => [...prev, newResume]);
        setUpload({ status: "success", progress: 100, error: null });

        // Reset to idle after 2 s
        setTimeout(
          () => setUpload({ status: "idle", progress: 0, error: null }),
          2000,
        );
      } catch (err: any) {
        setUpload({ status: "error", progress: 0, error: err.message });
      }
    },
    [upload.status],
  );

  // ── Set default — optimistic ───────────────────────────────────────────────
  const setDefault = useCallback((id: string) => {
    setResumes((prev) => prev.map((r) => ({ ...r, isDefault: r.id === id })));
    api(`${API_BASE}/resumes/${id}/default`, "PATCH").catch(() => {
      // rollback — re-fetch on failure
      api<Resume[]>(`${API_BASE}/resumes`, "GET")
        .then(setResumes)
        .catch(() => {});
    });
  }, []);

  // ── Delete — optimistic ───────────────────────────────────────────────────
  const deleteResume = useCallback(
    (id: string) => {
      const snapshot = resumes;
      setResumes((prev) => prev.filter((r) => r.id !== id));
      api(`${API_BASE}/resumes/${id}`, "DELETE").catch(() => {
        setResumes(snapshot); // rollback
      });
    },
    [resumes],
  );

  // ── Reset upload error ─────────────────────────────────────────────────────
  const resetUpload = useCallback(() => {
    setUpload({ status: "idle", progress: 0, error: null });
  }, []);

  return {
    resumes,
    loading,
    error,
    upload,
    uploadResume,
    setDefault,
    deleteResume,
    resetUpload,
  };
}
