import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Search, SlidersHorizontal, UserRoundSearch } from "lucide-react";
import { CandidateTable } from "@/components/candidates/candidate-parts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { candidateQueryKeys, candidateService } from "@/lib/api/candidate-service";

export const Route = createFileRoute("/_workspace/candidates/")({
  loader: ({ context }) =>
    context.queryClient.ensureQueryData({
      queryKey: candidateQueryKeys.list(),
      queryFn: () => candidateService.getCandidates(),
    }),
  head: () => ({
    meta: [
      { title: "Candidates | Archivum Talent Ledger" },
      {
        name: "description",
        content: "Browse and manage candidate profiles in your resume archive.",
      },
      { property: "og:title", content: "Candidates | Archivum" },
      {
        property: "og:description",
        content: "Browse recruiter candidate profiles and resume records.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: CandidatesPage,
});

function CandidatesPage() {
  const { data: candidates } = useSuspenseQuery({
    queryKey: candidateQueryKeys.list(),
    queryFn: () => candidateService.getCandidates(),
  });
  const [query, setQuery] = useState("");
  const filtered = candidates.filter((candidate) =>
    [candidate.name, candidate.currentRole, candidate.location, ...candidate.skills]
      .join(" ")
      .toLowerCase()
      .includes(query.toLowerCase()),
  );
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-[9px] uppercase text-accent">Talent archive</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">Candidates</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Candidate profiles from your talent database.
          </p>
        </div>
        <Button asChild variant="outline">
          <Link to="/search">
            <UserRoundSearch size={15} /> Find a candidate
          </Link>
        </Button>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-[220px] flex-1 sm:max-w-md">
          <Search
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            aria-label="Search candidate list"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search name, role, skill, or location"
            className="pl-9"
          />
        </div>
        <span className="inline-flex items-center gap-2 text-xs text-muted-foreground">
          <SlidersHorizontal size={14} />
          {filtered.length} profiles
        </span>
      </div>
      <div className="overflow-hidden rounded-lg border border-border bg-surface/60">
        <CandidateTable candidates={filtered} />
      </div>
      <p className="text-xs text-muted-foreground">
        Ledger archive · {candidates.length} candidate profiles
      </p>
    </div>
  );
}
