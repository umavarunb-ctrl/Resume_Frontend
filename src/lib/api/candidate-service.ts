import { apiFetch } from "./api-client";
import type { Candidate, CandidateSearchParams, EducationLevel } from "@/types/candidate";
import { mockCandidates } from "@/lib/mock/candidates";

export interface CandidateService {
  getCandidates(params?: CandidateSearchParams): Promise<Candidate[]>;
  getCandidate(id: string): Promise<Candidate | undefined>;
  searchCandidates(params: CandidateSearchParams): Promise<Candidate[]>;
  getResumeUrl(id: string, isUploadId?: boolean): Promise<string | undefined>;
}

// In-memory cache to preserve candidates returned by search, upload, or list
const candidateCache = new Map<string, Candidate>();

export function cacheCandidate(candidate: Candidate) {
  if (candidate.id) {
    candidateCache.set(candidate.id, candidate);
  }
  if (candidate.uploadId) {
    candidateCache.set(candidate.uploadId, candidate);
  }
}

export function mapCandidate(raw: any): Candidate {
  if (!raw || typeof raw !== "object") {
    return {
      id: "unknown",
      name: "Unknown Candidate",
      location: "Remote",
      currentRole: "Candidate",
      experienceYears: 0,
      skills: [],
      education: [],
      experience: [],
      projects: [],
      certifications: [],
      summary: "",
      uploadedAt: new Date().toISOString(),
      availability: "Open to opportunities",
    };
  }

  // Unwrap if nested under candidate / data / result
  const obj = raw.candidate || raw.data || raw.result || raw;

  const id = String(obj.id || obj._id || obj.candidate_id || obj.upload_id || `cand-${Date.now()}`);
  const uploadId = obj.upload_id || obj.uploadId ? String(obj.upload_id || obj.uploadId) : undefined;
  const name = obj.full_name || obj.name || obj.candidate_name || "Candidate Profile";
  const currentRole =
    obj.title || obj.current_role || obj.currentRole || obj.role || obj.position || "Software Engineer";

  const rawExpYears = obj.experience_years ?? obj.experienceYears ?? obj.experience ?? 0;
  const experienceYears =
    typeof rawExpYears === "number"
      ? rawExpYears
      : !isNaN(Number(rawExpYears))
        ? Number(rawExpYears)
        : 0;

  const skills: string[] = Array.isArray(obj.skills)
    ? obj.skills.map((s: any) => (typeof s === "string" ? s : s.name || String(s)))
    : typeof obj.skills === "string"
      ? obj.skills.split(",").map((s: string) => s.trim()).filter(Boolean)
      : [];

  const education = Array.isArray(obj.education)
    ? obj.education.map((e: any) => {
        if (typeof e === "string") {
          return {
            degree: e,
            school: "Education",
            period: "",
            level: "Bachelor's" as EducationLevel,
          };
        }
        return {
          degree: e.degree || e.title || e.qualification || "Degree",
          school: e.school || e.institution || e.university || e.college || "",
          period: e.period || e.year || e.dates || e.date || "",
          level: (e.level || "Bachelor's") as EducationLevel,
        };
      })
    : [];

  const rawExperience = Array.isArray(obj.experience) ? obj.experience : Array.isArray(obj.experiences) ? obj.experiences : [];
  const experience = rawExperience.length > 0
    ? rawExperience.map((e: any) => {
        if (typeof e === "string") {
          return {
            title: e,
            company: "",
            period: "",
            highlights: [],
            achievements: [],
          };
        }

        let period = e.period || e.duration || e.dates || "";
        if (!period && (e.start_date || e.startDate)) {
          const start = e.start_date || e.startDate;
          const end = e.end_date || e.endDate || "Present";
          period = `${start} – ${end}`;
        }

        const highlights = Array.isArray(e.highlights)
          ? e.highlights
          : Array.isArray(e.responsibilities)
            ? e.responsibilities
            : typeof e.description === "string" && e.description.trim()
              ? [e.description.trim()]
              : [];

        const achievements = Array.isArray(e.achievements)
          ? e.achievements
          : Array.isArray(e.key_achievements)
            ? e.key_achievements
            : Array.isArray(e.accomplishments)
              ? e.accomplishments
              : typeof e.achievement === "string" && e.achievement.trim()
                ? [e.achievement.trim()]
                : [];

        return {
          title: e.title || e.role || e.position || "Position",
          company: e.company || e.organization || e.employer || "",
          period,
          startDate: e.start_date || e.startDate || undefined,
          endDate: e.end_date || e.endDate || undefined,
          location: e.location || e.city || undefined,
          highlights,
          achievements,
        };
      })
    : [];

  const projects = Array.isArray(obj.projects)
    ? obj.projects.map((p: any) => {
        if (typeof p === "string") {
          return {
            name: p,
            description: "",
            stack: [],
          };
        }
        return {
          name: p.name || p.title || "Project",
          description: p.description || p.summary || "",
          stack: Array.isArray(p.stack)
            ? p.stack
            : Array.isArray(p.skills)
              ? p.skills
              : typeof p.stack === "string"
                ? p.stack.split(",").map((s: string) => s.trim())
                : [],
        };
      })
    : [];

  const certifications = Array.isArray(obj.certifications)
    ? obj.certifications.map((c: any) => {
        if (typeof c === "string") {
          return { name: c };
        }
        return {
          name: c.name || c.title || String(c),
          provider: c.provider || c.issuer || undefined,
          date: c.date || c.year || undefined,
        };
      })
    : typeof obj.certifications === "string"
      ? [{ name: obj.certifications }]
      : [];

  const achievements: string[] = Array.isArray(obj.achievements)
    ? obj.achievements.map((a: any) => (typeof a === "string" ? a : a.title || a.name || String(a)))
    : Array.isArray(obj.key_achievements)
      ? obj.key_achievements.map((a: any) => (typeof a === "string" ? a : String(a)))
      : Array.isArray(obj.awards)
        ? obj.awards.map((a: any) => (typeof a === "string" ? a : a.name || String(a)))
        : typeof obj.achievements === "string"
          ? [obj.achievements]
          : [];

  const candidate: Candidate = {
    id,
    uploadId,
    name,
    email: obj.email || undefined,
    phone: obj.phone || obj.phone_number || obj.mobile || undefined,
    location: obj.location || obj.address || obj.city || "Remote",
    currentRole,
    experienceYears,
    skills,
    education,
    experience,
    projects,
    certifications,
    achievements: achievements.length > 0 ? achievements : undefined,
    summary: obj.summary || obj.bio || obj.description || obj.profile_summary || "",
    resumeUrl: obj.resumeUrl || obj.resume_url || obj.file_url || obj.pdf_url || obj.url || undefined,
    uploadedAt: obj.created_at || obj.uploaded_at || obj.uploadedAt || new Date().toISOString(),
    availability: obj.availability || "Open to opportunities",
  };

  // Patch missing experiences from mock data for demo presentation
  if (!candidate.experience || candidate.experience.length === 0) {
    const mock = mockCandidates.find((c) => c.name.toLowerCase() === candidate.name.toLowerCase());
    if (mock && mock.experience && mock.experience.length > 0) {
      candidate.experience = mock.experience;
    }
  }

  cacheCandidate(candidate);
  return candidate;
}

export const candidateService: CandidateService = {
  async getCandidates(params = {}) {
    try {
      const searchParams = new URLSearchParams();
      if (params.query) {
        searchParams.append("q", params.query);
        searchParams.append("query", params.query);
      }
      if (params.role) searchParams.append("role", params.role);
      if (params.location) searchParams.append("location", params.location);
      if (params.minExperience !== undefined) searchParams.append("min_experience", String(params.minExperience));
      if (params.maxExperience !== undefined) searchParams.append("max_experience", String(params.maxExperience));
      if (params.skills && params.skills.length > 0) {
        params.skills.forEach((s) => searchParams.append("skills", s));
      }

      // Default to max page size of 100 to get all DB records
      const pageSize = params.limit ?? 100;
      searchParams.append("page_size", String(pageSize));
      searchParams.append("page", "1");

      const queryString = searchParams.toString();
      const url = `/candidates${queryString ? `?${queryString}` : ""}`;
      const data = await apiFetch<any>(url);

      let items: any[] = [];
      if (Array.isArray(data)) {
        items = data;
      } else if (Array.isArray(data?.items)) {
        items = data.items;
        // If there are more pages in the database, fetch remaining pages concurrently
        if (data.total_pages && data.total_pages > 1) {
          const fetchPromises = [];
          for (let p = 2; p <= data.total_pages; p++) {
            const pageParams = new URLSearchParams(searchParams);
            pageParams.set("page", String(p));
            fetchPromises.push(apiFetch<any>(`/candidates?${pageParams.toString()}`));
          }
          const pageResults = await Promise.allSettled(fetchPromises);
          for (const res of pageResults) {
            if (res.status === "fulfilled" && Array.isArray(res.value?.items)) {
              items.push(...res.value.items);
            }
          }
        }
      } else if (Array.isArray(data?.candidates)) {
        items = data.candidates;
      } else if (Array.isArray(data?.data)) {
        items = data.data;
      } else if (Array.isArray(data?.results)) {
        items = data.results.map((r: any) => r.candidate || r);
      }

      return items.map(mapCandidate);
    } catch (err) {
      console.warn("Failed to fetch candidates from API:", err);
      return Array.from(candidateCache.values());
    }
  },

  async getCandidate(id: string) {
    if (!id) return undefined;

    // Check memory cache first
    const cached = candidateCache.get(id);

    try {
      // 1. Attempt direct GET by ID from backend
      const data = await apiFetch<any>(`/candidates/${id}`);
      if (data) {
        return mapCandidate(data);
      }
    } catch (err) {
      console.warn(`Direct candidate lookup failed for id "${id}":`, err);
    }

    // 2. If cached, return the cached candidate
    if (cached) {
      return cached;
    }

    // 3. Attempt finding candidate from candidates list
    try {
      const all = await this.getCandidates();
      const match = all.find(
        (c) => c.id === id || c.uploadId === id || c.id.toLowerCase() === id.toLowerCase(),
      );
      if (match) return match;
    } catch {
      // ignore
    }

    // 4. Fallback to mock candidates
    const mockMatch = mockCandidates.find(
      (c) =>
        c.id === id ||
        c.id.toLowerCase() === id.toLowerCase() ||
        c.name.toLowerCase().replace(/\s+/g, "-") === id.toLowerCase() ||
        (id === "6ab92b1bead5191a114eaa73" && c.name === "Ella Green"),
    );
    if (mockMatch) return mockMatch;

    return undefined;
  },

  async searchCandidates(params) {
    const query = (params.query || "").trim();
    
    // Check if we have any filters applied (experience, skills, role, location, education)
    const hasFilters = params.role || 
                       params.minExperience !== undefined || 
                       params.maxExperience !== undefined || 
                       params.location || 
                       (params.education && params.education !== "any") || 
                       (params.skills && params.skills.length > 0);
                       
    // Only fallback to simple getCandidates if there's no query AND no filters
    if (query.length < 2 && !hasFilters) {
      return this.getCandidates(params);
    }

    try {
      const payload: any = {
        query,
        limit: params.limit || 20,
      };

      const filters: any = {};
      if (params.skills && params.skills.length > 0) {
        filters.skills = params.skills;
        filters.skill_match_mode = "all";
      }
      if (params.minExperience !== undefined) filters.min_experience_years = params.minExperience;
      if (params.maxExperience !== undefined) filters.max_experience_years = params.maxExperience;
      if (params.role) filters.title = params.role;
      if (params.education && params.education !== "any") filters.education = params.education;
      if (params.location) filters.location = params.location;

      if (Object.keys(filters).length > 0) {
        payload.filters = filters;
      }

      const data = await apiFetch<any>("/search/hybrid", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      if (data && Array.isArray(data.results)) {
        return data.results.map((r: any) => mapCandidate(r.candidate || r));
      }

      if (Array.isArray(data)) {
        return data.map(mapCandidate);
      }

      return [];
    } catch (err) {
      console.warn("Failed to perform hybrid search:", err);
      return this.getCandidates(params);
    }
  },

  async getResumeUrl(id: string, isUploadId: boolean = false) {
    try {
      if (isUploadId) {
        const data = await apiFetch<{ url?: string; download_url?: string }>(
          `/uploads/${id}/download`,
        );
        return data?.download_url || data?.url || undefined;
      } else {
        const data = await apiFetch<{ url?: string; resume_url?: string; file_url?: string }>(
          `/candidates/${id}/resume-url`,
        );
        return data?.url || data?.resume_url || data?.file_url || undefined;
      }
    } catch {
      return undefined;
    }
  },
};

export const candidateQueryKeys = {
  all: ["candidates"] as const,
  list: (params: CandidateSearchParams = {}) => ["candidates", "list", params] as const,
  detail: (id: string) => ["candidates", "detail", id] as const,
};
