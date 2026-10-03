export type EducationLevel = "Bachelor's" | "Master's" | "PhD";

export interface CandidateExperience {
  title: string;
  company: string;
  period: string;
  startDate?: string | undefined;
  endDate?: string | undefined;
  location?: string | undefined;
  highlights: string[];
  achievements?: string[] | undefined;
}

export interface CandidateEducation {
  degree: string;
  school: string;
  period: string;
  level: EducationLevel;
}

export interface CandidateProject {
  name: string;
  description: string;
  stack: string[];
}

export interface CandidateCertification {
  name: string;
  provider?: string | undefined;
  date?: string | undefined;
}

export interface Candidate {
  id: string;
  name: string;
  email?: string | undefined;
  phone?: string | undefined;
  location: string;
  currentRole: string;
  experienceYears: number;
  skills: string[];
  education: CandidateEducation[];
  experience: CandidateExperience[];
  projects: CandidateProject[];
  certifications: CandidateCertification[];
  achievements?: string[] | undefined;
  summary: string;
  resumeUrl?: string | undefined;
  uploadId?: string | undefined;
  uploadedAt: string;
  availability: "Available" | "Open to opportunities" | "Not specified";
}

export interface CandidateSearchParams {
  query?: string;
  minExperience?: number;
  maxExperience?: number;
  skills?: string[];
  role?: string;
  location?: string;
  education?: string;
  freshness?: string;
  page?: number;
  limit?: number;
}
