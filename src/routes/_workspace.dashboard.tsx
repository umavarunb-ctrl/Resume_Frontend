import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  BriefcaseBusiness,
  FileText,
  Search,
  Users,
  TrendingUp,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { CandidateTable } from "@/components/candidates/candidate-parts";
import { candidateQueryKeys, candidateService } from "@/lib/api/candidate-service";
import { dashboardQueryKeys, dashboardService } from "@/lib/api/dashboard-service";
import { authService } from "@/lib/api/auth-service";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/_workspace/dashboard")({
  loader: ({ context }) => {
    return Promise.all([
      context.queryClient.ensureQueryData({
        queryKey: candidateQueryKeys.list(),
        queryFn: () => candidateService.getCandidates(),
      }),
      context.queryClient.ensureQueryData({
        queryKey: dashboardQueryKeys.stats(),
        queryFn: () => dashboardService.getStats(),
      }),
    ]);
  },
  head: () => ({
    meta: [
      { title: "Dashboard | Archivum Talent Ledger" },
      {
        name: "description",
        content: "Recruiter overview of recent candidates, resume activity, and talent search.",
      },
      { property: "og:title", content: "Dashboard | Archivum Talent Ledger" },
      {
        property: "og:description",
        content: "Recruiter overview of recent candidates, resume activity, and talent search.",
      },
      { property: "og:type", content: "website" },
    ],
  }),
  component: DashboardPage,
});

function DashboardPage() {
  const { data: candidates } = useSuspenseQuery({
    queryKey: candidateQueryKeys.list(),
    queryFn: () => candidateService.getCandidates(),
  });

  const { data: stats } = useQuery({
    queryKey: dashboardQueryKeys.stats(),
    queryFn: () => dashboardService.getStats(),
  });

  const [userName, setUserName] = useState("Recruiter");
  useEffect(() => {
    authService.getCurrentUser().then((u) => {
      if (u && u.name) setUserName(u.name);
    });
  }, []);

  const totalCandidates = stats?.total_candidates ?? candidates.length;
  const totalResumes = stats?.total_resumes ?? candidates.length;
  const searchesThisMonth = stats?.searches_this_month ?? 0;
  const candidatesViewed = stats?.candidates_viewed ?? 0;

  const statCards = [
    {
      title: "Total candidates",
      value: totalCandidates.toLocaleString(),
      note: "Candidate database archive",
      icon: Users,
    },
    {
      title: "Total resumes",
      value: totalResumes.toLocaleString(),
      note: "Processed PDF intake",
      icon: FileText,
    },
    {
      title: "Searches this month",
      value: searchesThisMonth.toLocaleString(),
      note: "Hybrid vector + filter queries",
      icon: Search,
    },
    {
      title: "Candidates viewed",
      value: candidatesViewed.toLocaleString(),
      note: "Profile reviews & inquiries",
      icon: BriefcaseBusiness,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Welcome back, {userName}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Monitor talent metrics, review new resumes, and find candidates faster.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild variant="outline" size="sm">
            <Link to="/upload">
              <FileText size={14} /> Upload Resumes
            </Link>
          </Button>
          <Button asChild size="sm">
            <Link to="/search">
              <Search size={14} /> Search candidates <ArrowRight size={14} />
            </Link>
          </Button>
        </div>
      </div>

      {/* Live Backend Statistics */}
      <section
        aria-label="Workspace statistics"
        className="overflow-hidden rounded-xl border border-border bg-card shadow-sm"
      >
        <div className="grid grid-cols-2 gap-px bg-border lg:grid-cols-4">
          {statCards.map(({ title, value, note, icon: Icon }, index) => (
            <div
              key={title}
              className={`bg-card p-4 sm:p-5 transition-colors hover:bg-surface/80 ${index > 1 ? "hidden sm:block" : ""
                } ${index > 1 ? "lg:block" : ""}`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-medium text-muted-foreground">{title}</span>
                <span className="grid size-8 place-items-center rounded-md bg-secondary text-foreground">
                  <Icon size={15} />
                </span>
              </div>
              <div className="mt-3 text-2xl font-bold tracking-tight tabular-nums text-foreground">
                {value}
              </div>
              <div className="mt-1 text-[11px] text-muted-foreground">{note}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Main Content Grid */}
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_290px]">
        <section className="min-w-0">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold">Recent candidates</h2>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Latest candidate profiles added to your archive ledger
              </p>
            </div>
            <Button asChild variant="ghost" size="sm">
              <Link to="/candidates">
                View all <ArrowRight size={14} />
              </Link>
            </Button>
          </div>
          <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
            <CandidateTable candidates={candidates.slice(0, 7)} />
          </div>
        </section>

        <aside className="space-y-5">
          <section className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h2 className="text-sm font-semibold">Discovery shortcuts</h2>
              <Sparkles size={14} className="text-accent" />
            </div>
            <div className="divide-y divide-border">
              {[
                { query: "Python Developer", params: "3+ years · FastAPI", count: "Hybrid search" },
                { query: "Frontend React", params: "TypeScript · 2+ years", count: "Hybrid search" },
                { query: "Java Spring Boot", params: "Microservices", count: "Hybrid search" },
                { query: "Data Engineer", params: "SQL · Python · AWS", count: "Hybrid search" },
              ].map((search) => (
                <Link
                  key={search.query}
                  to="/search"
                  search={{ q: search.query }}
                  className="flex items-center justify-between gap-3 py-3 transition-colors hover:text-accent group"
                >
                  <span className="min-w-0">
                    <span className="block text-sm font-medium group-hover:underline truncate">
                      {search.query}
                    </span>
                    <span className="mt-0.5 block text-[11px] text-muted-foreground truncate">
                      {search.params}
                    </span>
                  </span>
                  <span className="shrink-0 rounded bg-secondary px-1.5 py-0.5 font-mono text-[9px] text-muted-foreground">
                    {search.count}
                  </span>
                </Link>
              ))}
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
