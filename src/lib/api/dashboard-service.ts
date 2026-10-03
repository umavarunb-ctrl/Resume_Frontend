import { apiFetch } from "./api-client";
import type { DashboardStatsResponse } from "@/types/dashboard";

export const dashboardService = {
  /**
   * Fetch workspace and resume analytics from FastAPI
   * GET /api/dashboard/stats
   */
  async getStats(): Promise<DashboardStatsResponse> {
    try {
      const data = await apiFetch<DashboardStatsResponse>("/dashboard/stats");
      return {
        total_candidates: Number(data?.total_candidates ?? 0),
        total_resumes: Number(data?.total_resumes ?? 0),
        searches_this_month: Number(data?.searches_this_month ?? 0),
        candidates_viewed: Number(data?.candidates_viewed ?? 0),
      };
    } catch (err) {
      console.warn("Failed to fetch dashboard stats from API:", err);
      return {
        total_candidates: 0,
        total_resumes: 0,
        searches_this_month: 0,
        candidates_viewed: 0,
      };
    }
  },
};

export const dashboardQueryKeys = {
  all: ["dashboard"] as const,
  stats: () => ["dashboard", "stats"] as const,
};
