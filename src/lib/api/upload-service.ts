import { apiFetch } from "./api-client";

export interface UploadResumeResponse {
  id?: string;
  candidate_id?: string;
  filename?: string;
  message?: string;
  status?: string;
  candidate?: any;
  data?: any;
  [key: string]: any;
}

export const uploadService = {
  /**
   * Upload a single resume PDF to the backend FastAPI endpoint
   * POST /api/uploads/resume
   */
  async uploadResume(file: File): Promise<UploadResumeResponse> {
    const formData = new FormData();
    formData.append("file", file);

    const response = await apiFetch<UploadResumeResponse>("/uploads/resume", {
      method: "POST",
      body: formData,
    });

    return response;
  },

  /**
   * Upload multiple resume PDFs to the backend FastAPI batch endpoint
   * POST /api/uploads/batch
   */
  async uploadMultipleResumes(files: File[]): Promise<UploadResumeResponse[]> {
    const formData = new FormData();
    files.forEach(file => formData.append("files", file));

    const response = await apiFetch<UploadResumeResponse[]>("/uploads/batch", {
      method: "POST",
      body: formData,
    });

    return response;
  },
};
