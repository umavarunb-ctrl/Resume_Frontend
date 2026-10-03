import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Plus, Search, SlidersHorizontal, X } from "lucide-react";
import { CandidateResult } from "@/components/candidates/candidate-parts";
import { ResumeViewerDialog } from "@/components/candidates/resume-viewer-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { candidateQueryKeys, candidateService } from "@/lib/api/candidate-service";
import type { CandidateSearchParams, Candidate } from "@/types/candidate";

interface SearchState {
  q?: string;
  minExperience?: string;
  maxExperience?: string;
  skills?: string;
  role?: string;
  location?: string;
  education?: string;
  freshness?: string;
  page?: string;
}

const roleSkillMap: Record<string, string[]> = {
  "Java Developer": [
    "Java",
    "Spring Boot",
    "Hibernate",
    "Microservices",
    "REST APIs",
    "JPA",
    "Kafka",
    "Maven",
    "SQL",
    "Docker",
    "PostgreSQL",
    "JUnit",
  ],
  "Python Developer": [
    "Python",
    "FastAPI",
    "Django",
    "Flask",
    "PostgreSQL",
    "Docker",
    "Celery",
    "Redis",
    "Pandas",
    "PyTest",
    "AWS",
    "REST APIs",
  ],
  "Frontend Developer": [
    "React",
    "TypeScript",
    "JavaScript",
    "Next.js",
    "Tailwind CSS",
    "HTML/CSS",
    "Vue",
    "Redux",
    "REST APIs",
    "GraphQL",
    "Jest",
    "Webpack",
  ],
  "Backend Developer": [
    "Node.js",
    "Python",
    "Java",
    "Go",
    "PostgreSQL",
    "MongoDB",
    "Docker",
    "Microservices",
    "Redis",
    "REST APIs",
    "GraphQL",
    "AWS",
  ],
  "Full Stack Developer": [
    "React",
    "Node.js",
    "TypeScript",
    "Python",
    "Java",
    "PostgreSQL",
    "MongoDB",
    "Docker",
    "REST APIs",
    "Tailwind CSS",
    "Next.js",
    "AWS",
  ],
  "DevOps Engineer": [
    "Docker",
    "Kubernetes",
    "AWS",
    "Terraform",
    "CI/CD",
    "Linux",
    "GitLab CI",
    "Jenkins",
    "Ansible",
    "Prometheus",
    "Grafana",
    "Bash",
  ],
  "Data Engineer": [
    "Python",
    "SQL",
    "Apache Spark",
    "Airflow",
    "Kafka",
    "PostgreSQL",
    "Snowflake",
    "AWS",
    "ETL",
    "Databricks",
    "BigQuery",
    "Docker",
  ],
  "Data Scientist": [
    "Python",
    "Machine Learning",
    "Pandas",
    "NumPy",
    "Scikit-Learn",
    "TensorFlow",
    "SQL",
    "PyTorch",
    "Data Visualization",
    "Statistics",
    "NLP",
    "Deep Learning",
  ],
  "Machine Learning Engineer": [
    "Python",
    "PyTorch",
    "TensorFlow",
    "MLOps",
    "Scikit-Learn",
    "Deep Learning",
    "Docker",
    "Kubernetes",
    "NLP",
    "Computer Vision",
    "FastAPI",
    "AWS",
  ],
  "Cloud Engineer": [
    "AWS",
    "Azure",
    "GCP",
    "Terraform",
    "Kubernetes",
    "Docker",
    "CloudFormation",
    "Linux",
    "Networking",
    "IAM",
    "CI/CD",
    "Serverless",
  ],
  "Software Engineer": [
    "Python",
    "Java",
    "TypeScript",
    "React",
    "Node.js",
    "PostgreSQL",
    "Docker",
    "AWS",
    "Git",
    "REST APIs",
    "Data Structures",
    "System Design",
  ],
  "Mobile Developer": [
    "React Native",
    "Flutter",
    "Swift",
    "Kotlin",
    "iOS",
    "Android",
    "TypeScript",
    "Dart",
    "Mobile UI",
    "REST APIs",
    "Firebase",
    "Xcode",
  ],
  "QA Engineer": [
    "Selenium",
    "Cypress",
    "Playwright",
    "Jest",
    "PyTest",
    "API Testing",
    "Automation Testing",
    "Postman",
    "JIRA",
    "CI/CD",
    "Performance Testing",
    "SQL",
  ],
};

const defaultSkillOptions = [
  "Python",
  "FastAPI",
  "Django",
  "Java",
  "Spring Boot",
  "React",
  "TypeScript",
  "AWS",
  "Docker",
  "MongoDB",
  "PostgreSQL",
  "Node.js",
];

const roleOptions = [
  "Python Developer",
  "Java Developer",
  "Backend Developer",
  "Frontend Developer",
  "Full Stack Developer",
  "DevOps Engineer",
  "Data Engineer",
  "Data Scientist",
  "Machine Learning Engineer",
  "Cloud Engineer",
  "Software Engineer",
  "Mobile Developer",
  "QA Engineer",
];

const parseSearch = (raw: Record<string, unknown>): SearchState => ({
  q: typeof raw["q"] === "string" ? raw["q"] : "",
  minExperience: typeof raw["minExperience"] === "string" ? raw["minExperience"] : "",
  maxExperience: typeof raw["maxExperience"] === "string" ? raw["maxExperience"] : "",
  skills: typeof raw["skills"] === "string" ? raw["skills"] : "",
  role: typeof raw["role"] === "string" ? raw["role"] : "",
  location: typeof raw["location"] === "string" ? raw["location"] : "",
  education: typeof raw["education"] === "string" ? raw["education"] : "any",
  freshness: typeof raw["freshness"] === "string" ? raw["freshness"] : "any",
  page: typeof raw["page"] === "string" ? raw["page"] : "1",
});

const paramsFor = (state: SearchState): CandidateSearchParams => ({
  ...(state.q ? { query: state.q } : {}),
  ...(state.minExperience && !isNaN(Number(state.minExperience))
    ? { minExperience: parseFloat(state.minExperience) }
    : {}),
  ...(state.maxExperience && !isNaN(Number(state.maxExperience))
    ? { maxExperience: parseFloat(state.maxExperience) }
    : {}),
  ...(state.skills
    ? { skills: state.skills.split(",").map((s) => s.trim()).filter(Boolean) }
    : {}),
  ...(state.role ? { role: state.role } : {}),
  ...(state.location ? { location: state.location } : {}),
  ...(state.education ? { education: state.education } : {}),
  ...(state.freshness ? { freshness: state.freshness } : {}),
});

export const Route = createFileRoute("/_workspace/search")({
  validateSearch: parseSearch,
  loaderDeps: ({ search }) => ({ ...search }),
  loader: ({ context, deps }) => {
    const state = parseSearch(deps);
    const params = paramsFor(state);
    return context.queryClient.ensureQueryData({
      queryKey: candidateQueryKeys.list(params),
      queryFn: () => candidateService.searchCandidates(params),
    });
  },
  head: () => ({
    meta: [
      { title: "Find Candidates | Archivum Talent Ledger" },
      {
        name: "description",
        content: "Search candidate profiles by role, skills, experience, location, and education.",
      },
      { property: "og:title", content: "Find Candidates | Archivum" },
      { property: "og:description", content: "Search and filter the recruiter candidate archive." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: CandidateSearchPage,
});

function CandidateSearchPage() {
  const searchState = Route.useSearch();
  const current = parseSearch(searchState as Record<string, unknown>);
  const navigate = Route.useNavigate();
  const params = paramsFor(current);
  const { data: candidates } = useSuspenseQuery({
    queryKey: candidateQueryKeys.list(params),
    queryFn: () => candidateService.searchCandidates(params),
  });
  const [draft, setDraft] = useState(current);
  const [resume, setResume] = useState<Candidate | null>(null);
  const [showOtherSkill, setShowOtherSkill] = useState(false);
  const [customSkillInput, setCustomSkillInput] = useState("");

  useEffect(() => setDraft(current), [searchState]);

  const currentRoleSkills: string[] =
    (draft.role ? roleSkillMap[draft.role] : undefined) ?? defaultSkillOptions;
  const selectedSkills = draft.skills?.split(",").map((s) => s.trim()).filter(Boolean) ?? [];
  const customSkills = selectedSkills.filter(
    (s) => !currentRoleSkills.some((rs) => rs.toLowerCase() === s.toLowerCase())
  );

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    void navigate({ search: { ...draft, page: "1" } });
  };

  const clear = () => {
    const cleared: SearchState = {
      q: "",
      minExperience: "",
      maxExperience: "",
      skills: "",
      role: "",
      location: "",
      education: "any",
      freshness: "any",
      page: "1",
    };
    setDraft(cleared);
    setShowOtherSkill(false);
    setCustomSkillInput("");
    void navigate({ search: cleared });
  };

  const addSkill = (skill: string, checked: boolean) => {
    const next = checked
      ? [...selectedSkills, skill]
      : selectedSkills.filter((selected) => selected.toLowerCase() !== skill.toLowerCase());
    setDraft({ ...draft, skills: next.join(",") });
  };

  const addCustomSkill = () => {
    const trimmed = customSkillInput.trim();
    if (!trimmed) return;
    const skillsToAdd = trimmed
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const next = [...selectedSkills];
    for (const skill of skillsToAdd) {
      if (!next.some((s) => s.toLowerCase() === skill.toLowerCase())) {
        next.push(skill);
      }
    }
    setDraft({ ...draft, skills: next.join(",") });
    setCustomSkillInput("");
    setShowOtherSkill(true);
  };

  const removeSkill = (skillToRemove: string) => {
    const next = selectedSkills.filter(
      (s) => s.toLowerCase() !== skillToRemove.toLowerCase()
    );
    setDraft({ ...draft, skills: next.join(",") });
  };

  const page = Math.max(1, Number(current.page) || 1);
  const pageSize = 8;
  const pageCount = Math.max(1, Math.ceil(candidates.length / pageSize));
  const visible = candidates.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className="space-y-5">
      <div>
        <p className="font-mono text-[9px] uppercase text-accent">Candidate discovery</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">Find candidates</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Search the sample archive by role, skills, or experience.
        </p>
      </div>
      <form onSubmit={submit} className="flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Search
            size={17}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            aria-label="Search candidates by role skills or experience"
            value={draft.q ?? ""}
            onChange={(event) => setDraft({ ...draft, q: event.target.value })}
            placeholder="Search candidates by role, skills, or experience…"
            className="h-11 pl-10"
          />
        </div>
        <Button type="submit" className="h-11 px-6">
          <Search size={15} /> Search
        </Button>
      </form>
      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        <span className="font-medium text-foreground">Try:</span>
        {["Python developer", "Java Spring Boot", "Frontend React", "Python AWS"].map((example) => (
          <button
            key={example}
            type="button"
            onClick={() => {
              setDraft({ ...draft, q: example });
              void navigate({ search: { ...current, q: example, page: "1" } });
            }}
            className="rounded border border-border px-2 py-1 hover:bg-secondary"
          >
            {example}
          </button>
        ))}
      </div>
      <div className="grid items-start gap-5 lg:grid-cols-[230px_minmax(0,1fr)]">
        <form
          onSubmit={submit}
          className="space-y-4 rounded-lg border border-border bg-surface/60 p-4 lg:sticky lg:top-20 self-start max-h-[calc(100vh-6rem)] overflow-y-auto"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <SlidersHorizontal size={15} /> Filters
            </div>
            <button
              type="button"
              onClick={clear}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Clear all
            </button>
          </div>
          <label className="block text-xs font-medium">
            Minimum experience (years)
            <input
              type="number"
              min="0"
              max="50"
              step="0.1"
              value={draft.minExperience ?? ""}
              onChange={(event) => setDraft({ ...draft, minExperience: event.target.value })}
              placeholder="e.g. 2.5"
              className="mt-1.5 h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
            />
          </label>
          <label className="block text-xs font-medium">
            Maximum experience (years)
            <input
              type="number"
              min="0"
              max="50"
              step="0.1"
              value={draft.maxExperience ?? ""}
              onChange={(event) => setDraft({ ...draft, maxExperience: event.target.value })}
              placeholder="e.g. 5.5"
              className="mt-1.5 h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
            />
          </label>
          <label className="block text-xs font-medium">
            Job role
            <select
              value={draft.role ?? ""}
              onChange={(event) => setDraft({ ...draft, role: event.target.value })}
              className="mt-1.5 h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="">Any role</option>
              {roleOptions.map((role) => (
                <option key={role}>{role}</option>
              ))}
            </select>
          </label>
          <label className="block text-xs font-medium">
            Location
            <select
              value={draft.location ?? ""}
              onChange={(event) => setDraft({ ...draft, location: event.target.value })}
              className="mt-1.5 h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="">Any location</option>
              <option value="Remote">Remote</option>
              <option value="Hyderabad">Hyderabad</option>
              <option value="Bangalore">Bangalore</option>
              <option value="Chennai">Chennai</option>
              <option value="Mumbai">Mumbai</option>
              <option value="Pune">Pune</option>
              <option value="Delhi">Delhi</option>
              <option value="Noida">Noida</option>
              <option value="Gurgaon">Gurgaon</option>
              <option value="Austin">Austin</option>
              <option value="New York">New York</option>
              <option value="San Francisco">San Francisco</option>
              <option value="Dallas">Dallas</option>
              <option value="Fort Worth">Fort Worth</option>
            </select>
          </label>
          <label className="block text-xs font-medium">
            Education
            <select
              value={draft.education ?? "any"}
              onChange={(event) => setDraft({ ...draft, education: event.target.value })}
              className="mt-1.5 h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="any">Any education</option>
              <option value="bachelor">Bachelor's</option>
              <option value="master">Master's</option>
              <option value="phd">PhD</option>
            </select>
          </label>

          <fieldset className="space-y-2.5">
            <div className="flex items-center justify-between">
              <legend className="text-xs font-medium">
                Skills {draft.role ? <span className="text-[10px] font-normal text-muted-foreground truncate max-w-[110px]">({draft.role.replace(" Developer", "").replace(" Engineer", "")})</span> : null}
              </legend>
              {selectedSkills.length > 0 && (
                <button
                  type="button"
                  onClick={() => setDraft({ ...draft, skills: "" })}
                  className="text-[10px] text-muted-foreground hover:text-foreground"
                >
                  Reset
                </button>
              )}
            </div>
            <div className="grid grid-cols-2 gap-y-2">
              {currentRoleSkills.map((skill) => (
                <label
                  key={skill}
                  className="flex min-w-0 items-center gap-2 text-xs text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={selectedSkills.some((s) => s.toLowerCase() === skill.toLowerCase())}
                    onChange={(event) => addSkill(skill, event.target.checked)}
                    className="size-3.5 rounded accent-accent"
                  />
                  <span className="truncate" title={skill}>{skill}</span>
                </label>
              ))}
              <label className="flex min-w-0 items-center gap-2 text-xs font-medium text-foreground cursor-pointer hover:text-accent transition-colors">
                <input
                  type="checkbox"
                  checked={showOtherSkill || customSkills.length > 0}
                  onChange={(event) => setShowOtherSkill(event.target.checked)}
                  className="size-3.5 rounded accent-accent"
                />
                <span className="truncate">Others</span>
              </label>
            </div>

            {(showOtherSkill || customSkills.length > 0) && (
              <div className="mt-2 space-y-2 rounded-md border border-border/80 bg-background/50 p-2.5">
                <label className="block text-[11px] font-medium text-muted-foreground">
                  Custom requirement skill
                </label>
                <div className="flex gap-1.5">
                  <Input
                    type="text"
                    value={customSkillInput}
                    onChange={(e) => setCustomSkillInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addCustomSkill();
                      }
                    }}
                    placeholder="e.g. Kafka, Redis..."
                    className="h-8 text-xs px-2.5 flex-1"
                  />
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    onClick={addCustomSkill}
                    disabled={!customSkillInput.trim()}
                    className="h-8 px-2.5 text-xs"
                  >
                    <Plus size={13} className="mr-1" /> Add
                  </Button>
                </div>

                {customSkills.length > 0 && (
                  <div className="pt-1">
                    <p className="text-[10px] text-muted-foreground mb-1">Added skills:</p>
                    <div className="flex flex-wrap gap-1.5">
                      {customSkills.map((skill) => (
                        <span
                          key={skill}
                          className="inline-flex items-center gap-1 rounded bg-accent/15 px-2 py-0.5 text-xs font-medium text-accent border border-accent/25"
                        >
                          <span className="max-w-[120px] truncate">{skill}</span>
                          <button
                            type="button"
                            onClick={() => removeSkill(skill)}
                            className="rounded hover:bg-accent/20 p-0.5 transition-colors focus:outline-none"
                            title={`Remove ${skill}`}
                          >
                            <X size={11} />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </fieldset>

          <Button type="submit" className="w-full">
            Apply filters
          </Button>
        </form>

        <section
          className="flex flex-col min-w-0 overflow-hidden rounded-lg border border-border bg-surface/50"
          aria-live="polite"
        >
          <div className="shrink-0 flex flex-wrap items-center justify-between gap-3 border-b border-border bg-surface/80 px-4 py-3 backdrop-blur-sm">
            <div>
              <h2 className="text-sm font-semibold">{candidates.length} candidates found</h2>
              <p className="mt-1 text-[11px] text-muted-foreground">
                Sorted by recently added · match scores unavailable
              </p>
            </div>
            <span className="font-mono text-[9px] uppercase text-muted-foreground">
              Page {page} of {pageCount}
            </span>
          </div>
          <ScrollArea className="h-[calc(100vh-16rem)] min-h-[440px] w-full">
            {visible.length ? (
              <div className="divide-y divide-border">
                {visible.map((candidate) => (
                  <CandidateResult
                    key={candidate.id}
                    candidate={candidate}
                    onResume={(selected) => setResume(selected)}
                  />
                ))}
              </div>
            ) : (
              <div className="px-6 py-16 text-center">
                <div className="mx-auto grid size-11 place-items-center rounded-md bg-secondary">
                  <Search size={19} />
                </div>
                <h3 className="mt-4 font-semibold">No candidates found</h3>
                <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
                  Try removing filters, reducing the minimum experience, or searching for a broader
                  role.
                </p>
                <Button variant="outline" className="mt-4" onClick={clear}>
                  Clear filters
                </Button>
              </div>
            )}
          </ScrollArea>
          {candidates.length > pageSize && (
            <div className="shrink-0 flex items-center justify-between border-t border-border bg-surface/80 px-4 py-3 backdrop-blur-sm">
              <span className="text-xs text-muted-foreground">
                Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, candidates.length)}{" "}
                of {candidates.length}
              </span>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={page <= 1}
                  onClick={() => void navigate({ search: { ...current, page: String(page - 1) } })}
                >
                  Previous
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={page >= pageCount}
                  onClick={() => void navigate({ search: { ...current, page: String(page + 1) } })}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </section>
      </div>
      {resume && (
        <ResumeViewerDialog candidate={resume} onClose={() => setResume(null)} />
      )}
    </div>
  );
}
