import config from "@/lib/config";
import { apiFetch, clearAuthSession, isJwtExpired } from "./api-client";

export interface Recruiter {
  id?: string;
  name: string;
  company: string;
  email: string;
  role?: string;
  profilePicture?: string | null | undefined;
}

export interface UserRegisterRequest {
  email: string;
  password: string;
  full_name: string;
  role?: string;
  profile_picture?: string | null;
  company_name?: string | null;
}

export interface UserLoginRequest {
  email: string;
  password: string;
}

export interface UserResponse {
  id: string;
  email: string;
  full_name: string;
  role: string;
  profile_picture?: string | null;
  company_name?: string | null;
  created_at: string;
  updated_at?: string;
}

export interface TokenResponse {
  access_token: string;
  expires_in?: number;
  token_type: string;
  user?: UserResponse;
}

export interface AuthService {
  login(email: string, password: string): Promise<Recruiter>;
  register(
    name: string,
    company: string,
    email: string,
    password: string,
    role?: string,
    profilePicture?: string | null,
  ): Promise<Recruiter>;
  logout(): Promise<void>;
  logoutLocal(): void;
  getCurrentUser(): Promise<Recruiter>;
  updateProfile(profile: Recruiter): Promise<Recruiter>;
  uploadProfilePicture(base64Image: string): Promise<Recruiter>;
  deleteProfilePicture(): Promise<Recruiter>;
  isAuthenticated(): boolean;
}

let currentRecruiter: Recruiter | null = null;

export const authService: AuthService = {
  /**
   * Register a new recruiter/user account
   * POST /api/auth/register
   */
  async register(
    name: string,
    company: string,
    email: string,
    password: string,
    role = "recruiter",
    profilePicture = null,
  ): Promise<Recruiter> {
    const payload: UserRegisterRequest = {
      full_name: name.trim(),
      company_name: company.trim() || null,
      email: email.trim().toLowerCase(),
      password,
      role,
      profile_picture: profilePicture,
    };

    const data = await apiFetch<UserResponse>("/auth/register", {
      method: "POST",
      body: JSON.stringify(payload),
      skipAuth: true,
    });

    const recruiter: Recruiter = {
      id: data.id,
      name: data.full_name,
      company: data.company_name || company || "",
      email: data.email,
      role: data.role,
      profilePicture: data.profile_picture ?? null,
    };

    currentRecruiter = recruiter;
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("archivum_user", JSON.stringify(recruiter));
      } catch {
        // ignore
      }
    }

    return recruiter;
  },

  /**
   * Authenticate and receive JWT token
   * POST /api/auth/login
   */
  async login(email: string, password: string): Promise<Recruiter> {
    const payload: UserLoginRequest = {
      email: email.trim().toLowerCase(),
      password,
    };

    const tokenData = await apiFetch<TokenResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify(payload),
      skipAuth: true,
    });

    const token = tokenData.access_token;
    if (typeof window !== "undefined" && token) {
      try {
        localStorage.setItem("archivum_token", token);
      } catch {
        // ignore
      }
    }

    // Fetch full user profile using the JWT bearer token
    let recruiter: Recruiter = {
      name: email.split("@")[0] || "Recruiter",
      company: "Workspace",
      email: email.trim().toLowerCase(),
      role: "recruiter",
      profilePicture: null,
    };

    try {
      const userData = await apiFetch<UserResponse>("/users/me");
      recruiter = {
        id: userData.id,
        name: userData.full_name,
        company: userData.company_name || "",
        email: userData.email,
        role: userData.role,
        profilePicture: userData.profile_picture ?? null,
      };
    } catch {
      // ignore
    }

    currentRecruiter = recruiter;
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("archivum_user", JSON.stringify(recruiter));
      } catch {
        // ignore
      }
    }

    return recruiter;
  },

  /**
   * Logout current session
   * POST /api/auth/logout
   */
  async logout(): Promise<void> {
    try {
      await apiFetch("/auth/logout", { method: "POST" });
    } catch {
      // ignore network errors on logout
    }

    this.logoutLocal();
  },

  /**
   * Clear local storage auth session
   */
  logoutLocal(): void {
    clearAuthSession();
    currentRecruiter = null;
  },

  /**
   * Get current user profile
   * GET /api/users/me
   */
  async getCurrentUser(): Promise<Recruiter> {
    if (!this.isAuthenticated()) {
      throw new Error("Unauthenticated access");
    }

    try {
      const data = await apiFetch<UserResponse>("/users/me");
      currentRecruiter = {
        id: data.id,
        name: data.full_name,
        company: data.company_name || "",
        email: data.email,
        role: data.role,
        profilePicture: data.profile_picture ?? null,
      };
      if (typeof window !== "undefined") {
        localStorage.setItem("archivum_user", JSON.stringify(currentRecruiter));
      }
      return currentRecruiter;
    } catch (e) {
      if (typeof window !== "undefined") {
        const saved = localStorage.getItem("archivum_user");
        if (saved) {
          try {
            currentRecruiter = JSON.parse(saved);
            return currentRecruiter!;
          } catch {
            // ignore
          }
        }
      }
      throw e;
    }
  },

  /**
   * Update recruiter profile
   * PUT /api/users/me
   */
  async updateProfile(profile: Recruiter): Promise<Recruiter> {
    try {
      const data = await apiFetch<UserResponse>("/users/me", {
        method: "PUT",
        body: JSON.stringify({
          full_name: profile.name,
          company_name: profile.company,
        }),
      });

      currentRecruiter = {
        id: data.id,
        name: data.full_name,
        company: data.company_name || "",
        email: data.email,
        role: data.role,
        profilePicture: data.profile_picture ?? currentRecruiter?.profilePicture ?? null,
      };
    } catch (e) {
      console.warn("API update failed, saving locally:", e);
      if (!currentRecruiter) throw e;
      currentRecruiter = {
        ...currentRecruiter,
        name: profile.name,
        company: profile.company,
      };
    }

    if (typeof window !== "undefined") {
      localStorage.setItem("archivum_user", JSON.stringify(currentRecruiter));
    }
    return currentRecruiter;
  },

  /**
   * Upload profile picture
   * POST /api/users/me/profile-picture
   */
  async uploadProfilePicture(base64Image: string): Promise<Recruiter> {
    try {
      const res = await fetch(base64Image);
      const blob = await res.blob();
      const formData = new FormData();
      formData.append("file", blob, "profile.jpg");

      const data = await apiFetch<UserResponse>("/users/me/profile-picture", {
        method: "POST",
        body: formData,
      });

      currentRecruiter = {
        ...(currentRecruiter as Recruiter),
        id: data.id,
        name: data.full_name,
        profilePicture: data.profile_picture ?? null,
      };
    } catch (e) {
      console.warn("API picture upload failed, saving locally:", e);
      if (!currentRecruiter) throw e;
      currentRecruiter = {
        ...currentRecruiter,
        profilePicture: base64Image,
      };
    }

    if (typeof window !== "undefined") {
      localStorage.setItem("archivum_user", JSON.stringify(currentRecruiter));
    }
    return currentRecruiter;
  },

  /**
   * Delete profile picture
   * DELETE /api/users/me/profile-picture
   */
  async deleteProfilePicture(): Promise<Recruiter> {
    try {
      const data = await apiFetch<UserResponse>("/users/me/profile-picture", {
        method: "DELETE",
      });

      currentRecruiter = {
        ...(currentRecruiter as Recruiter),
        id: data.id,
        name: data.full_name,
        profilePicture: null,
      };
    } catch (e) {
      console.warn("API picture delete failed, saving locally:", e);
      if (!currentRecruiter) throw e;
      currentRecruiter = {
        ...currentRecruiter,
        profilePicture: null,
      };
    }

    if (typeof window !== "undefined") {
      localStorage.setItem("archivum_user", JSON.stringify(currentRecruiter));
    }
    return currentRecruiter;
  },

  /**
   * Check if user is authenticated (token exists and not expired)
   */
  isAuthenticated(): boolean {
    if (typeof window !== "undefined") {
      try {
        const token = localStorage.getItem("archivum_token");
        if (!token) return false;
        if (isJwtExpired(token)) {
          clearAuthSession();
          return false;
        }
        return true;
      } catch {
        return false;
      }
    }
    return false;
  },
};

