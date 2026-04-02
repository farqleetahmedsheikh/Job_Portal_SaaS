/** @format */

export interface Resume {
  id: string;
  name: string;
  originalName: string;
  fileUrl: string;
  fileSize: number;
  isDefault: boolean;
  uploadedAt: string; // ISO
  usedIn?: number; // how many applications this resume was sent with
}

export interface UploadState {
  status: "idle" | "uploading" | "success" | "error";
  progress: number; // 0–100
  error: string | null;
}
