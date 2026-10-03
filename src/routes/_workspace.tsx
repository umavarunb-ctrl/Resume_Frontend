import { createFileRoute, redirect } from "@tanstack/react-router";
import { WorkspaceLayout } from "@/components/layout/workspace";
import { authService } from "@/lib/api/auth-service";

export const Route = createFileRoute("/_workspace")({
  beforeLoad: ({ location }) => {
    if (typeof window !== "undefined" && !authService.isAuthenticated()) {
      const targetUrl = location.href || (location.pathname + location.searchStr);
      const searchObj: { redirect?: string } = {};
      if (targetUrl && targetUrl !== "/" && targetUrl !== "/login") {
        searchObj.redirect = targetUrl;
      }
      throw redirect({
        to: "/login",
        search: searchObj,
      });
    }
  },
  component: WorkspaceLayout,
});

